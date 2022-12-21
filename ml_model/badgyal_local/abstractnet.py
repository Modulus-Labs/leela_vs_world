import torch
import badgyal_local.model as model
import badgyal_local.net as proto_net
import badgyal_local.proto.net_pb2 as pb
import chess
from badgyal_local.board2planes import board2planes, policy2moves, bulk_board2planes
import pylru
import sys


CACHE = 100000
MAX_BATCH = 8
MIN_POLICY = 0.2


class AbstractNet:

    def __init__(self, cuda=True, torchScript=False):
        self.net = self.load_net()
        self.cuda = cuda
        if self.cuda:
            self.net = self.net.cuda()
        self.torchScript = torchScript
        # optimize
        if torchScript:
            #self.net = torch.jit.trace(self.net, self.trace_batch().cuda())
            self.net = torch.jit.script(self.net)
        self.net.eval()
        self.cache = pylru.lrucache(CACHE)
        self.prefetch = {}

    @staticmethod
    def trace_batch():
        boards = []
        moves = ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4"]
        for i in range(16):
            b = chess.Board()
            boards.append(b)
            for m in moves:
                b = b.copy()
                b.push_uci(m)
                boards.append(b)
        return bulk_board2planes(boards)

    def save_jit(self, path):
        assert self.torchScript
        self.net.save(path)

    def process_boards(self, boards, name=None):
        input = bulk_board2planes(boards)

        # --- Ryan's stuff ---
        # print(f"In process boards. Received boards {boards} and processed into")
        # print(input)
        # print(input.shape) # (1, 112, 8, 8)

        # from torchinfo import summary
        # import os
        # import onnx
        # summary(self.net, input_data=input, verbose=1)
        # print(self.net)
        # self.net(input)
        # print(type(self.net))
        # print(dir(self.net))
        # print()
        # summary(self.net, input_data=input, verbose=2)
        # assert(name is not None)
        # os.path.isdir("onnx_models") or os.makedirs("onnx_models")
        # onnx_model_path = os.path.join("onnx_models", f"{name}.onnx")
        # onnx_shape_infer_model_path = os.path.join("onnx_models", f"{name}_with_shapes.onnx")
        # torch.onnx.export(self.net, input, onnx_model_path, verbose=True)
        # onnx_model = onnx.load(onnx_model_path)
        # onnx_model = onnx.shape_inference.infer_shapes(onnx_model)
        # onnx.save(onnx_model, onnx_shape_infer_model_path)
        # exit()

        # --- End Ryan's stuff ---

        if self.cuda:
            input = input.pin_memory().cuda(non_blocking = True)
        with torch.jit.optimized_execution(True):
            with torch.no_grad():
                policies, values = self.net(input)
                return policies.cpu(), values.cpu()

    def cache_boards(self, boards, softmax_temp=1.61):
        for b in boards:
            epd = b.epd()
            if not epd in self.cache:
                self.prefetch[epd] = b

        if len(self.prefetch) > MAX_BATCH:
            policies, values = self.process_boards(self.prefetch.values())
            with torch.jit.optimized_execution(True):
                with torch.no_grad():
                    for i, b in enumerate(self.prefetch.values()):
                        inp = policies[i].unsqueeze(dim=0)
                        policy = policy2moves(b, inp, softmax_temp=softmax_temp)
                        value = values[i]
                        value = self.value_to_scalar(value)
                        self.cache[b.epd()] = [policy, value]
            self.prefetch = {}

    def cache_eval(self, board):
        epd = board.epd()
        if epd in self.cache:
            return self.cache[epd]
        else:
            return None, None

    def value_to_scalar(self, value):
        return value.item()

    def eval(self, board, softmax_temp=1.61, name=None):
        epd = board.epd()
        if epd in self.cache:
            policy, value = self.cache[epd]
        else:
            # put all the child positions on the board
            boards = [board.copy()]
            # print("Boards are:")
            # print(boards)
            policies, values = self.process_boards(boards, name=name)

            with torch.jit.optimized_execution(True):
                with torch.no_grad():
                    for i, b in enumerate(boards):
                        inp = policies[i].unsqueeze(dim=0)
                        policy = policy2moves(b, inp, softmax_temp=softmax_temp)
                        value = values[i]
                        value = self.value_to_scalar(value)
                        self.cache[b.epd()] = [policy, value]

            policy, value = self.cache[epd]

        # get the best move and prefetch it
        tocache = []

        for m, val in policy.items():
            if val >= MIN_POLICY:
                bd = board.copy()
                bd.push_uci(m)
                tocache.append(bd)
        if (len(tocache) < 1):
            m = max(policy, key = lambda k: policy[k])
            bd = board.copy()
            bd.push_uci(m)
            tocache.append(bd)
        self.cache_boards(tocache, softmax_temp=softmax_temp)

        # return the values
        return policy, value

    def bulk_eval(self, boards, softmax_temp=1.61):

        retval_p = []
        retval_v = []

        policies, values = self.process_boards(boards)

        with torch.jit.optimized_execution(True):
            with torch.no_grad():
                for i, b in enumerate(boards):
                    inp = policies[i].unsqueeze(dim=0)
                    policy = policy2moves(b, inp, softmax_temp=softmax_temp)
                    value = values[i]
                    value = self.value_to_scalar(value)
                    retval_p.append(policy)
                    retval_v.append(value)
                    self.cache[b.epd()] = [policy, value]

        return retval_p, retval_v
