from collections import OrderedDict

import torch
import torch.nn as nn
import torch.nn.init as init

import badgyal.lc0_az_policy_map as lc0_az_policy_map
import badgyal.net as proto_net
import badgyal.proto.net_pb2 as pb


class Net(nn.Module):
    def __init__(self, residual_channels, residual_blocks, policy_channels, se_ratio, classical=False, classicalPolicy=False):
        super().__init__()
        channels = residual_channels

        self.conv_block = ConvBlock(112, channels, 3, padding=1)

        blocks = [(f'block{i+1}', ResidualBlock(channels, se_ratio)) for i in range(residual_blocks)]
        self.residual_stack = nn.Sequential(OrderedDict(blocks))

        if classicalPolicy:
            self.policy_head = PolicyHeadClassical(channels, policy_channels)
        else:
            self.policy_head = PolicyHead(channels, policy_channels)
        if classical:
            self.value_head = ValueHeadClassical(channels, 32, 128)
        else:
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

    def forward(self, x):
        x = self.conv_block(x)
        x = self.residual_stack(x)

        policy = self.policy_head(x)
        value = self.value_head(x)
        return policy, value

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

    def forward(self, x):
        x = self.conv_block(x)
        x = self.conv(x)
        x = x.contiguous()
        x = x.view(x.size(0), -1)
        x = x.gather(dim=1, index=self.policy_map.expand(x.size(0), self.policy_map.size(1)))
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

        x = self.layers(x)

        x = x + x_in
        x = self.relu2(x)
        return x


class ConvBlock(nn.Sequential):
    def __init__(self, in_channels, out_channels, kernel_size, padding=0):
        super().__init__(OrderedDict([
            ('conv', nn.Conv2d(in_channels, out_channels, kernel_size, padding=padding, bias=False)),
            ('bn', nn.BatchNorm2d(out_channels)),
            ('relu', nn.ReLU(inplace=True)),
        ]))


class SqueezeExcitation(nn.Module):
    def __init__(self, channels, ratio):
        super().__init__()

        self.pool = nn.AdaptiveAvgPool2d(1)
        self.lin1 = nn.Linear(channels, channels // ratio)
        self.relu = nn.ReLU(inplace=True)
        self.lin2 = nn.Linear(channels // ratio, 2 * channels)

    def forward(self, x):
        n, c, h, w = x.size()
        x_in = x

        x = self.pool(x).view(n, c)
        x = self.lin1(x)
        x = self.relu(x)
        x = self.lin2(x)

        x = x.view(n, 2 * c, 1, 1)
        scale, shift = x.chunk(2, dim=1)

        x = scale.sigmoid() * x_in + shift
        return x


class Flatten(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, x):
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
