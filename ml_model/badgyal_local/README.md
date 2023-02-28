# badgyal

Simple pytorch net evaluator with Bad Gyal 8 and Mean Girl 8 net included. You can install with pip like so:

```
pip install git+https://github.com/dkappe/badgyal.git
```

An example of use:

```
import badgyal
import chess
import torch

POS = [
    "1k1r1b2/p4P2/Q1p4r/3p3q/Pp4p1/1P2P1P1/1BP2PK1/R3R3 b - -"
]
def eval(net, board):
    policy, value = net.eval(board, softmax_temp=1.61)
    print(value)
    print(policy)
    


bg = badgyal.BGNet(cuda=True)

for p in POS:
    board = chess.Board()
    board.set_epd(p)
    eval(bg, board)
```
