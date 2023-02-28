import torch
import torch.nn as nn
import torch.nn.functional as F
import json
import math

torch.manual_seed(42)

def export_parameter_to_flattened_list(module_parameter: nn.Parameter):
  return list(math.floor(x.item()) for x in module_parameter.flatten())

def test_conv(with_bias: bool=False):
  # --- Default: C, H, W ---
  # --- Desired: C, W, H ---
  x = torch.randint(int(-1e6), int(1e6), (112 * 8 * 8,)).reshape(112, 8, 8).double()

  # --- Default: C_out, C_in, H, W ---
  # --- Desired: C_in, W, H, C_out ---
  conv2d = nn.Conv2d(112, 120, 3, padding=1, bias=with_bias)
  conv2d_weight = torch.randint(int(-1e6), int(1e6), (112 * 120 * 3 * 3,)).double().reshape(120, 112, 3, 3)
  conv2d.weight = nn.Parameter(conv2d_weight)

  if with_bias:
    conv2d_bias = torch.randint(int(-1e12), int(1e12), (2,)).double()
    conv2d.bias = nn.Parameter(conv2d_bias)

  out = conv2d(x)

  # print(f"Input: (C_in, H, W)")
  # print(F.pad(x, (1, 1, 1, 1), "constant", 0))
  # print(f"Weight: (C_out, C_in, H, W)")
  # print(conv2d.weight)
  # print(f"Weight: (C_in, W, H, C_out)")
  # print(conv2d.weight.permute(1, 3, 2, 0))
  # print(f"Output: (C_out, H, W)")
  print(out)
  print(list(x.item() for x in out.flatten()))

  json_dict = {
    "input": export_parameter_to_flattened_list(x.permute(0, 2, 1)),
    "input_dim": list(x.permute(0, 2, 1).shape),
    "conv_weight": export_parameter_to_flattened_list(conv2d.weight.permute(1, 3, 2, 0)),
    "conv_weight_dim": list(conv2d.weight.permute(1, 3, 2, 0).shape),
    "output": export_parameter_to_flattened_list(out.permute(0, 2, 1)),
    "output_dim": list(out.permute(0, 2, 1).shape)
  }
  if with_bias:
    json_dict["conv_bias"] = export_parameter_to_flattened_list(conv2d.bias)
    json_dict["conv_bias_dim"] = list(conv2d.bias.shape)

  with open(f"test_conv_with_negatives_with_bias_{with_bias}.json", "w") as f:
    json.dump(json_dict, f)

def test_adaptive_2d_avgpool():
  # --- Default: C, H, W ---
  # --- Desired: C, W, H ---
  x = torch.randint(int(-1e6), int(1e6), (4 * 8 * 8,)).reshape(4, 8, 8).float()

  adaptive2davgpool = nn.AdaptiveAvgPool2d(1)
  out = adaptive2davgpool(x)

  json_dict = {
    "input": export_parameter_to_flattened_list(x.permute(0, 2, 1)),
    "input_dim": list(x.permute(0, 2, 1).shape),
    "output": export_parameter_to_flattened_list(out.permute(0, 2, 1)),
    "output_dim": list(out.permute(0, 2, 1).shape)
  }
  with open("test_avgpool_with_negatives.json", "w") as f:
    json.dump(json_dict, f)

def test_fc(with_bias: bool=True, with_relu: bool=False):
  # --- Presumably single-dimensional ---
  x = torch.randint(int(-1e6), int(1e6), (13 * 8 * 8,)).float()

  # --- Assuming this is (out_dim, in_dim) ---
  linear = nn.Linear(bias=with_bias)
  linear_weight = torch.randint(int(-1e6), int(1e6), (13 * 8 * 8, 13 * 6 * 6)).float()
  linear.weight = nn.Parameter(linear_weight)
  if with_bias:
    linear_bias = torch.randint(int(-1e6), int(1e6), (13 * 6 * 6,)).float()
    linear.bias = nn.Parameter(linear_bias)
  
  out = linear(x)
  json_dict = {
    "input": export_parameter_to_flattened_list(x),
    "input_dim": list(x.shape),
    "output": export_parameter_to_flattened_list(out),
    "output_dim": list(out.shape),
    "linear_weight": export_parameter_to_flattened_list(linear.weight),
    "linear_weight_dim": list(linear.weight.shape)
  }
  if with_bias:
    json_dict["linear_bias"] = export_parameter_to_flattened_list(linear.bias)
    json_dict["linear_bias_dim"] = list(linear.bias.shape)
  
  with open(f"test_fc_with_negatives_with_bias_{with_bias}.json", "w") as f:
    json.dump(json_dict, f)


QUANTIZE_FACTOR = 1024 ** 2
SIGMOID_PIECEWISE_BOUND = 2


def near_zero_sigmoid_approx(x: torch.Tensor, quantize_factor=QUANTIZE_FACTOR):
    """
    1/2 + x/4 - x^3/64 + x^5/1024
    """
    intermediate = math.floor((quantize_factor ** 2) * 0.5) + torch.floor(x * math.floor(quantize_factor / 4))
    return torch.floor(intermediate / quantize_factor)
    # round(x ** 3 / 64) +
    # round(x ** 5 / 1024)


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

    # --- Otherwise, use approximation x / 4 + 0.5 ---
    middle = near_zero_sigmoid_approx(middle)

    # --- Set anything not in range of `-piecewise_bound, piecewise_bound` to 0
    middle[x < -1 * piecewise_bound] = 0
    middle[x > piecewise_bound] = 0
    # print((x / QUANTIZE_FACTOR).round().sigmoid() * QUANTIZE_FACTOR)

    return (middle + upper), piecewise_bound


def test_cursed_sigmoid():
  # --- Presumably single-dimensional? ---
  x = torch.randint(int(-3e6), int(3e6), (8 * 8,)).float()
  out, piecewise_bound = cursed_sigmoid(x)

  json_dict = {
    "input": export_parameter_to_flattened_list(x),
    "input_dim": list(x.shape),
    "output": export_parameter_to_flattened_list(out),
    "output_dim": list(out.shape),
    "lower_bound": -1 * piecewise_bound,
    "upper_bound": piecewise_bound,
    "max_value": QUANTIZE_FACTOR,
    "min_value": 0,
    "middle_addendum": math.floor(QUANTIZE_FACTOR * 0.5),
  }
  with open("cursed_sigmoid_test.json", "w") as f:
    json.dump(json_dict, f)


def test_distributed_mult():
  # --- 3-dim input C_in, H, W ---
  x = torch.randint(int(-1e9), int(1e9), (13, 8, 8)).float()

  # --- 3-dim input C_in, 1, 1 ---
  mult_factor = torch.randint(int(-1e9), int(1e9), (13, 1, 1)).float()
  out = x * mult_factor

  json_dict = {
    # --- Inputs/outputs ---
    "input": export_parameter_to_flattened_list(x.permute(0, 2, 1)),
    "input_dim": list(x.permute(0, 2, 1).shape),
    "output": export_parameter_to_flattened_list(out.permute(0, 2, 1)),
    "output_dim": list(out.permute(0, 2, 1).shape),

    # --- Parameters ---
    "mult_factor": export_parameter_to_flattened_list(mult_factor),
    "mult_factor_dim": list(mult_factor.shape),
  }

  with open("test_distributed_multiplication.json", "w") as f:
    json.dump(json_dict, f)


def test_distributed_add():
  # --- 3-dim input C_in, H, W ---
  x = torch.randint(int(-1e9), int(1e9), (13, 8, 8)).float()

  # --- 3-dim input C_in, 1, 1 ---
  add_factor = torch.randint(int(-1e9), int(1e9), (13, 1, 1)).float()
  out = x + add_factor

  json_dict = {
    # --- Inputs/outputs ---
    "input": export_parameter_to_flattened_list(x.permute(0, 2, 1)),
    "input_dim": list(x.permute(0, 2, 1).shape),
    "output": export_parameter_to_flattened_list(out.permute(0, 2, 1)),
    "output_dim": list(out.permute(0, 2, 1).shape),

    # --- Parameters ---
    "add_factor": export_parameter_to_flattened_list(add_factor),
    "add_factor_dim": list(add_factor.shape),
  }

  with open("test_distributed_addition.json", "w") as f:
    json.dump(json_dict, f)


def test_cursed_batchnorm():
  # --- Presumably 3-dimensional input C_in, H, W ---
  x = torch.randint(int(-1e9), int(1e9), (13, 8, 8)).float()

  # --- Want to just make up a batchnorm module ---
  batchnorm_mean = torch.randint(int(-1e8), int(1e8), (13, 1, 1)).float()
  batchnorm_coeff = torch.randint(int(-1e8), int(1e8), (13, 1, 1)).float()
  batchnorm_bias = torch.randint(int(-1e2), int(1e2), (13, 1, 1)).float() * QUANTIZE_FACTOR ** 2

  subtracted_mean = x + batchnorm_mean
  first_term = subtracted_mean * batchnorm_coeff
  unnormalized_first_term = first_term + batchnorm_bias
  out = torch.floor(unnormalized_first_term / QUANTIZE_FACTOR)

  json_dict = {
    # --- Inputs/outputs ---
    "input": export_parameter_to_flattened_list(x.permute(0, 2, 1)),
    "input_dim": list(x.permute(0, 2, 1).shape),
    "output": export_parameter_to_flattened_list(out.permute(0, 2, 1)),
    "output_dim": list(out.permute(0, 2, 1).shape),

    # --- Parameters ---
    "batchnorm_mean": export_parameter_to_flattened_list(batchnorm_mean),
    "batchnorm_mean_dim": list(batchnorm_mean.shape),
    "batchnorm_coeff": export_parameter_to_flattened_list(batchnorm_coeff),
    "batchnorm_coeff_dim": list(batchnorm_coeff.shape),
    "batchnorm_bias": export_parameter_to_flattened_list(batchnorm_bias),
    "batchnorm_bias_dim": list(batchnorm_bias.shape),

    # --- Intermediates ---
    "subtracted_mean": export_parameter_to_flattened_list(subtracted_mean.permute(0, 2, 1)),
    "subtracted_mean_dim": list(subtracted_mean.permute(0, 2, 1).shape),
    "first_term": export_parameter_to_flattened_list(first_term.permute(0, 2, 1)),
    "first_term_dim": list(first_term.permute(0, 2, 1).shape),
    "unnormalized_first_term": export_parameter_to_flattened_list(unnormalized_first_term.permute(0, 2, 1)),
    "unnormalized_first_term_dim": list(unnormalized_first_term.permute(0, 2, 1).shape),
  }

  with open("cursed_batchnorm_test.json", "w") as f:
    json.dump(json_dict, f)


def main():
  # test_distributed_mult()
  # test_distributed_add()
  # test_cursed_batchnorm()
  # test_adaptive_2d_avgpool()
  # test_cursed_sigmoid()
  test_conv()
  print(f"All done!")

if __name__ == "__main__":
  main()