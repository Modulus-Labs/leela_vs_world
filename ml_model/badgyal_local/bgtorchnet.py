import torch
import badgyal_local.model as model
import badgyal_local.net as proto_net
import badgyal_local.proto.net_pb2 as pb
import chess
from badgyal_local.board2planes import board2planes, policy2moves, bulk_board2planes
import pylru
import sys
import os.path
from badgyal_local.abstractnet import AbstractNet


class BGTorchNet(AbstractNet):

    def __init__(self, cuda=True):
        super().__init__(cuda=cuda)

    def load_net(self):
        my_path = os.path.abspath(os.path.dirname(__file__))
        file = os.path.join(my_path, "badgyal.pt")
        return torch.jit.load(file)
