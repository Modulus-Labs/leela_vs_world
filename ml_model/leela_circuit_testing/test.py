import torch
import torch.nn as nn
import json

def export_parameter_to_flattened_list(module_parameter: nn.Parameter):
  return list(round(x.item()) for x in module_parameter.flatten())

def main():
  # --- Default: C, H, W ---
  # --- Desired: C, W, H ---
  x = torch.randint(int(-1e6), int(1e6), (4 * 16 * 16,)).reshape(4, 16, 16).float()

  # --- Default: C_out, C_in, H, W ---
  # --- Desired: C_in, W, H, C_out ---
  conv2d = nn.Conv2d(4, 4, 3, padding=1, bias=False)
  conv2d_weight = torch.randint(int(-1e6), int(1e6), (4 * 4 * 3 * 3,)).float().reshape(4, 4, 3, 3)
  conv2d.weight = nn.Parameter(conv2d_weight)

  out = conv2d(x)
  print(out)

  json_dict = {
    "input": export_parameter_to_flattened_list(x.permute(0, 2, 1)),
    "input_dim": list(x.permute(0, 2, 1).shape),
    "conv_weight": export_parameter_to_flattened_list(conv2d.weight.permute(1, 3, 2, 0)),
    "conv_dim": list(conv2d.weight.permute(1, 3, 2, 0).shape),
    "output": export_parameter_to_flattened_list(out.permute(0, 2, 1)),
    "output_dim": list(out.permute(0, 2, 1).shape)
  }
  with open("test_conv_with_negatives.json", "w") as f:
    json.dump(json_dict, f)

if __name__ == "__main__":
  main()