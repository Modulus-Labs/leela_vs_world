from badgyal_local.abstractnet import AbstractNet
import math

class WDLNet(AbstractNet):
    def __init__(self, cuda=True, torchScript=False):
        super().__init__(cuda=cuda, torchScript=torchScript)

    def value_to_scalar(self, value):
        wdl0 = value[0].item()
        wdl1 = value[1].item()
        wdl2 = value[2].item()
        min_val = min(wdl0, wdl1, wdl2)
        w_val = math.exp(wdl0 - min_val)
        d_val = math.exp(wdl1 - min_val)
        l_val = math.exp(wdl2 - min_val)
        p = (w_val * 1.0 + d_val * 0.5 ) / (w_val + d_val + l_val)
        return 2.0*p-1.0;
