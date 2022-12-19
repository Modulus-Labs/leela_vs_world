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

CHANNELS=32
BLOCKS=4
SE=2


class MGNet(AbstractNet):

    def __init__(self, cuda=True, torchScript=False):
        super().__init__(cuda=cuda, torchScript=torchScript)

    def load_net(self):
        my_path = os.path.abspath(os.path.dirname(__file__))
        file = os.path.join(my_path, "meangirl-8.pb.gz")
        net = model.Net(CHANNELS, BLOCKS, CHANNELS, SE, classical=True)
        net.import_proto_classical(file)
        return net
