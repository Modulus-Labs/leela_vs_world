from collections import OrderedDict

import torch
import torch.nn as nn
import torch.nn.init as init
import math

import badgyal_local.lc0_az_policy_map as lc0_az_policy_map
import badgyal_local.net as proto_net
import badgyal_local.proto.net_pb2 as pb

# --- Ryan's addendum ---
QUANTIZE_NETWORKS = True
QUANTIZE_FACTOR = 1024 ** 2
# SIGMOID_PIECEWISE_BOUND = 2.654 # From numeric approximation
SIGMOID_PIECEWISE_BOUND = 2

# --- Hacky af, but it works ---
max_abs_intermediate_value = -1

def print_max_abs_value(context: str, named_tensors: dict[str, torch.Tensor]):
    """
    For sanitychecking.
    """
    global max_abs_intermediate_value
    print(f"\n--- Printing max values for {context} ---")
    for name, tensor in named_tensors.items():
        tensor_max_abs_value = torch.max(torch.abs(tensor)).item()
        print("Max abs value entry of tensor " + name + ": " + str(tensor_max_abs_value))
        # --- For logging overall max ---
        max_abs_intermediate_value = max(max_abs_intermediate_value, tensor_max_abs_value)


def near_zero_sigmoid_approx(x: torch.Tensor, quantize_factor=QUANTIZE_FACTOR):
    """
    1/2 + x/4 - x^3/64 + x^5/1024
    """
    return (
        math.floor(quantize_factor * 0.5) + torch.trunc(x / 4)
        # round(x ** 3 / 64) + 
        # round(x ** 5 / 1024)
    )


def cursed_sigmoid(x: torch.Tensor, quantize_factor=QUANTIZE_FACTOR):
    """
    Applies a piecewise polynomial approximation to sigmoid.
    """
    piecewise_bound = SIGMOID_PIECEWISE_BOUND * quantize_factor
    middle = x.detach().clone()
    upper = x.detach().clone()

    # --- Set anything above `piecewise_bound` to (scaled) 1 ---
    upper[x < piecewise_bound] = 0
    upper[x > piecewise_bound] = quantize_factor

    # --- Set anything not in range of `-piecewise_bound, piecewise_bound` to 0
    middle[x < -1 * piecewise_bound] = 0
    middle[x > piecewise_bound] = 0
    middle = near_zero_sigmoid_approx(middle)
    # print((x / QUANTIZE_FACTOR).round().sigmoid() * QUANTIZE_FACTOR)

    return (middle + upper)


def cursed_batchnorm(x: torch.Tensor, batchnorm_module: nn.BatchNorm2d, quantize_factor=QUANTIZE_FACTOR):
    """
    Manually computes the batchnorm, first fusing the division step.
    """
    gamma, beta = batchnorm_module.weight, batchnorm_module.bias
    e_x, var_x = batchnorm_module.running_mean, batchnorm_module.running_var

    # --- Expand dims ---
    gamma = gamma.reshape(1, -1, 1, 1)
    beta = beta.reshape(1, -1, 1, 1)
    e_x = e_x.reshape(1, -1, 1, 1)
    var_x = var_x.reshape(1, -1, 1, 1)

    # --- First compute (scaled) gamma / sqrt(var[x] + eps) ---
    # --- NOTE: This is what we'll eventually put into Halo2 ---
    # coeff = torch.round(gamma / torch.sqrt(var_x))

    coeff = torch.round((gamma * quantize_factor) / torch.sqrt(var_x + batchnorm_module.eps))
    subtracted_mean = x - e_x
    subtracted_mean_times_coeff = subtracted_mean * coeff
    normalized_first_term = torch.trunc(subtracted_mean_times_coeff / quantize_factor)

    # --- Check if any of these are too large ---
    print_max_abs_value("cursed_batchnorm", {
        "x": x,
        "subtracted_mean": subtracted_mean,
        "subtracted_mean_times_coeff": subtracted_mean_times_coeff,
        "normalized_first_term": normalized_first_term,
        "normalized_first_term + beta": normalized_first_term + beta
    })

    return normalized_first_term + beta

    # return ((x - e_x) / torch.sqrt(var_x)) * gamma + beta
    # return torch.trunc(batchnorm_module(x))


def export_parameter_to_flattened_list(module_parameter: nn.Parameter):
    return list(round(x.item()) for x in module_parameter.flatten())


class Net(nn.Module):
    def __init__(self, residual_channels, residual_blocks, policy_channels, se_ratio, classical=False, classicalPolicy=False):
        super().__init__()
        channels = residual_channels

        self.conv_block = ConvBlock(112, channels, 3, padding=1)

        blocks = [(f'block{i+1}', ResidualBlock(channels, se_ratio)) for i in range(residual_blocks)]
        self.residual_stack = nn.Sequential(OrderedDict(blocks))

        if classicalPolicy:
            # print(f"Using classical policy head")
            self.policy_head = PolicyHeadClassical(channels, policy_channels)
        else:
            # print(f"Using non-classical policy head")
            self.policy_head = PolicyHead(channels, policy_channels)
        if classical:
            # print(f"Using classical value head")
            self.value_head = ValueHeadClassical(channels, 32, 128)
        else:
            # print(f"Using non-classical value head")
            self.value_head = ValueHead(channels, 32, 128)

        self.reset_parameters()

    def reset_parameters(self):
        for module in self.modules():
            if isinstance(module, nn.Conv2d) or isinstance(module, nn.Linear):
                init.xavier_normal_(module.weight)
                if module.bias is not None:
                    init.zeros_(module.bias)
            if isinstance(module, nn.BatchNorm2d):
                init.ones_(module.weight)
                init.zeros_(module.bias)

    def quantize_parameters(self):
        print(f"Quantizing model weights! Quantize factor: {QUANTIZE_FACTOR}")
        for name, module in self.named_modules():
            if isinstance(module, nn.Conv2d) or isinstance(module, nn.Linear):
                module.weight = nn.Parameter(torch.round(module.weight * QUANTIZE_FACTOR))
                if module.bias is not None:
                    module.bias = nn.Parameter(torch.round(module.bias * QUANTIZE_FACTOR ** 2))
                # print(f"Just quantized layer: {name}!")
            if isinstance(module, nn.BatchNorm2d):
                module.weight = nn.Parameter(torch.round(module.weight * QUANTIZE_FACTOR))
                module.bias = nn.Parameter(torch.round(module.bias * QUANTIZE_FACTOR))
                # module.eps = nn.Parameter(round(module.eps * QUANTIZE_FACTOR))
                module.running_mean = nn.Parameter(torch.round(module.running_mean * QUANTIZE_FACTOR))
                module.running_var = nn.Parameter(torch.round(module.running_var * QUANTIZE_FACTOR ** 2))
                # print(f"Just quantized layer: {name}!")

    def forward(self, x: torch.Tensor):

        global max_abs_intermediate_value

        # --- Quantize model inputs ---
        if QUANTIZE_NETWORKS:
            max_abs_intermediate_value = -1
            x = torch.round(x * QUANTIZE_FACTOR)
        
        # --- Check if any of these are too large ---
        print_max_abs_value("initial x", {
            "x": x,
        })

        x = self.conv_block(x)
        x = self.residual_stack(x)

        # --- Compute policy head ---
        policy = self.policy_head(x)
        if QUANTIZE_NETWORKS:
            policy = policy / QUANTIZE_FACTOR
        # print(policy)

        value = self.value_head(x)
        if QUANTIZE_NETWORKS:
            value = value / QUANTIZE_FACTOR
        
        if QUANTIZE_NETWORKS:
            print(f"\n----- Max over everything!!! {max_abs_intermediate_value} -----\n")

        # print(value)
        return policy, value

    def export_to_json_for_halo2(self):
        """
        Returns JSON format for Halo2 model weight saving.

        Format:
        {
            "name": None or {
                "weight": [...],
                "bias": [...]
            } or {
                "coeff": int,
                "e_x": int,
                "beta": int,
            }
        }

        TODO(ryancao): Transpose weights and biases to match what Nick wants
        """
        ret = OrderedDict()
        for name, module in self.named_modules():
            print(name)
            if isinstance(module, nn.Conv2d):
                ret[name] = {
                    # C_o, C_i, H, W --> C_i, W, H, C_o
                    "weight": export_parameter_to_flattened_list(module.weight.permute(1, 3, 2, 0)),
                    "weight_shape": list(module.weight.permute(1, 3, 2, 0).shape)
                }
                if module.bias is not None:
                    ret[name]["bias"] = export_parameter_to_flattened_list(module.bias)
            elif isinstance(module, nn.Linear):
                ret[name] = {
                    "weight": export_parameter_to_flattened_list(module.weight),
                    "weight_shape": list(module.weight.shape)
                }
                if module.bias is not None:
                    ret[name]["bias"] = export_parameter_to_flattened_list(module.bias)
            elif isinstance(module, nn.BatchNorm2d):
                beta, gamma = module.bias, module.weight
                var_x, e_x = module.running_var, module.running_mean
                coeff = torch.round((gamma * QUANTIZE_FACTOR) / (torch.sqrt(var_x + module.eps)))

                ret[name] = {
                    "coeff": export_parameter_to_flattened_list(coeff),
                    "e_x": export_parameter_to_flattened_list(e_x),
                    "beta": export_parameter_to_flattened_list(beta)
                }
            else:
                ret[name] = None
        return ret

    def conv_and_linear_weights(self):
        return [m.weight for m in self.modules() if isinstance(m, nn.Conv2d) or isinstance(m, nn.Linear)]

    def from_checkpoint(self, path):
        checkpoint = torch.load(path)
        self.load_state_dict(checkpoint['net'])

    def export_proto(self, path):
        weights = [w.detach().cpu().numpy() for w in extract_weights(self)]
        weights[0][:, 109, :, :] /= 99  # scale rule50 weights due to legacy reasons
        proto = proto_net.Net(
            net=pb.NetworkFormat.NETWORK_SE_WITH_HEADFORMAT,
            input=pb.NetworkFormat.INPUT_CLASSICAL_112_PLANE,
            value=pb.NetworkFormat.VALUE_WDL,
            policy=pb.NetworkFormat.POLICY_CONVOLUTION,
        )
        proto.fill_net(weights)
        proto.save_proto(path)

    def import_proto(self, path):
        proto = proto_net.Net(
            net=pb.NetworkFormat.NETWORK_SE_WITH_HEADFORMAT,
            input=pb.NetworkFormat.INPUT_CLASSICAL_112_PLANE,
            value=pb.NetworkFormat.VALUE_WDL,
            policy=pb.NetworkFormat.POLICY_CONVOLUTION,
        )
        proto.parse_proto(path)
        weights = proto.get_weights()
        for model_weight, loaded_weight in zip(extract_weights(self), weights):
            model_weight.data = torch.from_numpy(loaded_weight).view_as(model_weight)
        self.conv_block[0].weight.data[:, 109, :, :] *= 99  # scale rule50 weights due to legacy reasons

    def import_proto_classical(self, path):
        proto = proto_net.Net(
            net=pb.NetworkFormat.NETWORK_SE_WITH_HEADFORMAT,
            input=pb.NetworkFormat.INPUT_CLASSICAL_112_PLANE,
            value=pb.NetworkFormat.VALUE_CLASSICAL,
            policy=pb.NetworkFormat.POLICY_CONVOLUTION,
        )
        proto.parse_proto(path)
        weights = proto.get_weights()
        for model_weight, loaded_weight in zip(extract_weights(self), weights):
            model_weight.data = torch.from_numpy(loaded_weight).view_as(model_weight)
        self.conv_block[0].weight.data[:, 109, :, :] *= 99  # scale rule50 weights due to legacy reasons

    def import_proto_classical_policy(self, path):
        proto = proto_net.Net(
            net=pb.NetworkFormat.NETWORK_SE_WITH_HEADFORMAT,
            input=pb.NetworkFormat.INPUT_CLASSICAL_112_PLANE,
            value=pb.NetworkFormat.VALUE_CLASSICAL,
            policy=pb.NetworkFormat.POLICY_CLASSICAL,
        )
        proto.parse_proto(path)
        weights = proto.get_weights()
        for model_weight, loaded_weight in zip(extract_weights(self), weights):
            model_weight.data = torch.from_numpy(loaded_weight).view_as(model_weight)
        self.conv_block[0].weight.data[:, 109, :, :] *= 99  # scale rule50 weights due to legacy reasons


    def export_onnx(self, path):
        dummy_input = torch.randn(10, 112, 8, 8)
        input_names = ['input_planes']
        output_names = ['policy_output', 'value_output']
        torch.onnx.export(self, dummy_input, path, input_names=input_names, output_names=output_names,
                          verbose=False, export_params=True,        # store the trained parameter weights inside the model file
                          opset_version=10,   # the ONNX version to export the model to
                          do_constant_folding=True,
                          dynamic_axes={'input_planes' : {0 : 'batch_size'}},
        )


class PolicyHead(nn.Module):
    def __init__(self, in_channels, policy_channels):
        super().__init__()
        self.conv_block = ConvBlock(in_channels, policy_channels, 3, padding=1)
        self.conv = nn.Conv2d(policy_channels, 80, 3, padding=1)
        # fixed mapping from az conv output to lc0 policy
        self.register_buffer('policy_map', self.create_gather_tensor())

    def create_gather_tensor(self):
        lc0_to_az_indices = dict(enumerate(lc0_az_policy_map.make_map('index')))
        az_to_lc0_indices = {az: lc0 for lc0, az in lc0_to_az_indices.items()}
        gather_indices = [lc0 for az, lc0 in sorted(az_to_lc0_indices.items()) if az != -1]
        return torch.LongTensor(gather_indices).unsqueeze(0)

    def forward(self, x: torch.Tensor):

        # --- Conv block just does its own thing ---
        x = self.conv_block(x)

        # --- Conv needs quantization ---
        x = self.conv(x)
        if QUANTIZE_NETWORKS:
            print_max_abs_value("policy head conv", {
                "x": x,
            })
            x = torch.round(x / QUANTIZE_FACTOR)

        x = x.contiguous()
        x = x.view(x.size(0), -1)
        # print(f"After reshape! x.shape: {x.shape}")
        # print(self.policy_map.shape)
        # print(self.policy_map.expand(x.size(0), self.policy_map.size(1)).shape)
        x = x.gather(dim=1, index=self.policy_map.expand(x.size(0), self.policy_map.size(1)))

        if QUANTIZE_NETWORKS:
            print_max_abs_value("policy head gather", {
                "x": x,
            })

        # print(f"After gather! x.shape: {x.shape}")
        return x

class PolicyHeadClassical(nn.Module):
    def __init__(self, in_channels, policy_channels):
        super().__init__()

        self.layers = nn.Sequential(
            ConvBlock(in_channels, policy_channels, 1),
            Flatten(),
            nn.Linear(8 * 8 * policy_channels, 1858),
        )

    def forward(self, x):
        x = self.layers(x)
        return x

class ValueHead(nn.Sequential):
    def __init__(self, in_channels, value_channels, lin_channels):
        super().__init__(OrderedDict([
            ('conv_block', ConvBlock(in_channels, value_channels, 1)),
            ('flatten', Flatten()),
            ('lin1', nn.Linear(value_channels * 8 * 8, lin_channels)),
            ('relu1', nn.ReLU(inplace=True)),
            ('lin2', nn.Linear(lin_channels, 3)),
        ]))

class ValueHeadClassical(nn.Sequential):
    def __init__(self, in_channels, value_channels, lin_channels):
        super().__init__(OrderedDict([
            ('conv_block', ConvBlock(in_channels, value_channels, 1)),
            ('flatten', Flatten()),
            ('lin1', nn.Linear(value_channels * 8 * 8, lin_channels)),
            ('relu1', nn.ReLU(inplace=True)),
            ('lin2', nn.Linear(lin_channels, 1)),
            ('tanh', nn.Tanh()),
        ]))
        self.conv_block = ConvBlock(in_channels, value_channels, 1)
        self.flatten = Flatten()
        self.lin1 = nn.Linear(value_channels * 8 * 8, lin_channels)
        self.relu1 = nn.ReLU(inplace=True)
        self.lin2 = nn.Linear(lin_channels, 1)
        self.tanh = nn.Tanh()
    
    def forward(self, x):
        x = self.conv_block(x)
        x = self.flatten(x)
        x = self.lin1(x)
        if QUANTIZE_NETWORKS:
            print_max_abs_value("value head lin 1", {
                "x": x,
            })
            x = torch.trunc(x / QUANTIZE_FACTOR)
        x = self.relu1(x)
        x = self.lin2(x)
        if QUANTIZE_NETWORKS:
            print_max_abs_value("value head lin 2", {
                "x": x,
            })
            x = torch.trunc(x / QUANTIZE_FACTOR)
        
        # if not QUANTIZE_NETWORKS:
        #     x = self.tanh(x)

        # --- We don't use tanh but that's probably fine ---

        return x


class ResidualBlock(nn.Module):
    def __init__(self, channels, se_ratio):
        super().__init__()
        # ResidualBlock can't be an nn.Sequential, because it would try to apply self.relu2
        # in the residual block even when not passed into the constructor
        self.layers = nn.Sequential(OrderedDict([
            ('conv1', nn.Conv2d(channels, channels, 3, padding=1, bias=False)),
            ('bn1', nn.BatchNorm2d(channels)),
            ('relu', nn.ReLU(inplace=True)),

            ('conv2', nn.Conv2d(channels, channels, 3, padding=1, bias=False)),
            ('bn2', nn.BatchNorm2d(channels)),

            ('se', SqueezeExcitation(channels, se_ratio)),
        ]))

        self.relu2 = nn.ReLU(inplace=True)

    def forward(self, x):
        x_in = x

        # x = self.layers(x)
        # --- Conv, then quantize ---
        x = self.layers.get_submodule("conv1")(x)
        if QUANTIZE_NETWORKS:
            print_max_abs_value("residual block conv 1", {
                "x": x,
            })
            x = torch.trunc(x / QUANTIZE_FACTOR)
        
        # --- Batchnorm, then round ---
        if QUANTIZE_NETWORKS:
            x = cursed_batchnorm(x, self.layers.get_submodule("bn1"))
        else:
            x = self.layers.get_submodule("bn1")(x)
        
        # --- ReLU # 1 ---
        x = self.layers.get_submodule("relu")(x)

        # --- Conv #2 ---
        x = self.layers.get_submodule("conv2")(x)
        if QUANTIZE_NETWORKS:
            print_max_abs_value("residual block conv 2", {
                "x": x,
            })
            x = torch.trunc(x / QUANTIZE_FACTOR)
        
        # --- Batchnorm #2 ---
        if QUANTIZE_NETWORKS:
            x = cursed_batchnorm(x, self.layers.get_submodule("bn2"))
        else:
            x = self.layers.get_submodule("bn2")(x)
        
        # --- SE ---
        x = self.layers.get_submodule("se")(x)

        # --- Residual + final ReLU ---
        x = x + x_in
        if QUANTIZE_NETWORKS:
            print_max_abs_value("residual block after SE and residual", {
                "x": x,
            })

        x = self.relu2(x)

        return x


class ConvBlock(nn.Sequential):
    def __init__(self, in_channels, out_channels, kernel_size, padding=0):
        super().__init__()
        # super().__init__(OrderedDict([
        #     ('conv', nn.Conv2d(in_channels, out_channels, kernel_size, padding=padding, bias=False)),
        #     ('bn', nn.BatchNorm2d(out_channels)),
        #     ('relu', nn.ReLU(inplace=True)),
        # ]))
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, padding=padding, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU()

    def forward(self, x):

        # print(f"Before conv block forward pass")

        # --- Conv, then normalize ---
        x = self.conv(x)

        # print(f"After first conv: {x}")
        if QUANTIZE_NETWORKS:
            print_max_abs_value("conv block post conv", {
                "x": x,
            })
            x = torch.trunc(x / QUANTIZE_FACTOR)
        # print(f"After first conv normalization: {x}")

        # --- Batchnorm, then normalize ---
        if QUANTIZE_NETWORKS:
            x = cursed_batchnorm(x, self.bn)
        else:
            x = self.bn(x)
        # print(f"After first batchnorm: {x}")

        x = self.relu(x)
        return x


class SqueezeExcitation(nn.Module):
    def __init__(self, channels, ratio):
        super().__init__()

        self.pool = nn.AdaptiveAvgPool2d(1)
        self.lin1 = nn.Linear(channels, channels // ratio)
        self.relu = nn.ReLU(inplace=True)
        self.lin2 = nn.Linear(channels // ratio, 2 * channels)

    def forward(self, x: torch.Tensor):
        # print(f"Before SE block! x.shape: {x.shape}")
        n, c, h, w = x.size()
        x_in = x

        x = self.pool(x).view(n, c)
        if QUANTIZE_NETWORKS:
            x = torch.trunc(x)
            print_max_abs_value("SE block post pooling", {
                "x": x,
            })
        # print(f"After first pooling layer! x.shape: {x.shape}")

        x = self.lin1(x)
        if QUANTIZE_NETWORKS:
            print_max_abs_value("SE block lin 1", {
                "x": x,
            })
            x = torch.trunc(x / QUANTIZE_FACTOR)
        # print(f"After first linear layer! x.shape: {x.shape}")

        x = self.relu(x)
        x = self.lin2(x)
        if QUANTIZE_NETWORKS:
            print_max_abs_value("SE block lin 2", {
                "x": x,
            })
            x = torch.trunc(x / QUANTIZE_FACTOR)
        # print(f"After second linear layer! x.shape: {x.shape}")

        x = x.view(n, 2 * c, 1, 1)
        # print(f"After reshape! x.shape: {x.shape}")

        scale, shift = x.chunk(2, dim=1)
        # print(f"After chunk! scale.shape: {scale.shape}")
        # print(f"After chunk! shift.shape: {scale.shape}")

        # TODO(ryancao): Is this actually circuit-friendly?
        if QUANTIZE_NETWORKS:
            # x = torch.trunc((scale / QUANTIZE_FACTOR).sigmoid() * x_in + shift)
            scale_sigmoid = cursed_sigmoid(scale)
            scaled_x_in = scale_sigmoid * x_in
            quantized = torch.trunc(scaled_x_in / QUANTIZE_FACTOR)
            quantized_and_shifted = quantized + shift
            print_max_abs_value("SE sigmoid with scale and shift", {
                "scale_sigmoid": scale_sigmoid,
                "scaled_x_in": scaled_x_in,
                "quantized": quantized,
                "quantized_and_shifted": quantized_and_shifted,
            })
            x = torch.trunc((cursed_sigmoid(scale) * x_in) / QUANTIZE_FACTOR) + shift
        else:
            x = scale.sigmoid() * x_in + shift
        # print(f"After SE block! x.shape: {x.shape}")

        return x


class Flatten(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, x: torch.Tensor):
        x = x.contiguous()
        return x.view(x.size(0), -1)


'''
class GhostBatchNorm2d(nn.Module):
    def __init__(self, channels, virtual_batch_size):
        self.bn = nn.BatchNorm2d(channels)

    def forward(self, x):
        # TODO should be able to do this with some reshaping here
        x = self.bn(x)
        return x
'''


def extract_weights(m):
    if isinstance(m, Net):
        yield from extract_weights(m.conv_block)
        for block in m.residual_stack:
            yield from extract_weights(block)
        yield from extract_weights(m.policy_head)
        yield from extract_weights(m.value_head)

    elif isinstance(m, SqueezeExcitation):
        yield from extract_weights(m.lin1)
        yield from extract_weights(m.lin2)

    elif isinstance(m, PolicyHead):
        yield from extract_weights(m.conv_block)
        yield from extract_weights(m.conv)

    elif isinstance(m, ResidualBlock):
        yield from extract_weights(m.layers)

    elif isinstance(m, nn.Sequential):
        for layer in m:
            yield from extract_weights(layer)

    elif isinstance(m, nn.Conv2d):
        # PyTorch uses same weight layout as cuDNN, so no transposes needed
        yield m.weight
        if m.bias is not None:
            yield m.bias

    elif isinstance(m, nn.BatchNorm2d):
        yield m.weight
        yield m.bias
        yield m.running_mean
        yield m.running_var

    elif isinstance(m, nn.Linear):
        # PyTorch uses same weight layout as cuDNN, so no transposes needed
        yield m.weight
        yield m.bias


if __name__ == '__main__':
    net = Net(256, 20, 80, 4).cuda()
    net.eval()
    with torch.no_grad():
        batch = torch.rand(2, 112, 8, 8).cuda()
        policy, value = net(batch)
        print(policy)
        print(value)
