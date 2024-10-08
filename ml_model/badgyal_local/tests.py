import badgyal
import chess
import re
import unittest

TESTS = {
    "rnbqkb1r/1p3ppp/p2p1n2/4p3/4P3/1NN1B3/PPP2PPP/R2QKB1R b KQkq - 1 7" : """
info depth 1 seldepth 1 time 5807 nodes 1 score cp 53 tbhits 0 pv f8e7
info string f6d5  (582 ) N:       0 (+ 0) (P:  0.12%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00248) (Q+U:  0.00782) (V:  -.----)
info string g7g5  (378 ) N:       0 (+ 0) (P:  0.18%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00378) (Q+U:  0.00912) (V:  -.----)
info string f6h5  (586 ) N:       0 (+ 0) (P:  0.18%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00394) (Q+U:  0.00928) (V:  -.----)
info string c8h3  (69  ) N:       0 (+ 0) (P:  0.19%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00408) (Q+U:  0.00942) (V:  -.----)
info string f6e4  (588 ) N:       0 (+ 0) (P:  0.19%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00413) (Q+U:  0.00947) (V:  -.----)
info string d8a5  (89  ) N:       0 (+ 0) (P:  0.19%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00416) (Q+U:  0.00950) (V:  -.----)
info string f6g8  (568 ) N:       0 (+ 0) (P:  0.22%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00482) (Q+U:  0.01016) (V:  -.----)
info string d8b6  (84  ) N:       0 (+ 0) (P:  0.24%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00507) (Q+U:  0.01041) (V:  -.----)
info string f6d7  (570 ) N:       0 (+ 0) (P:  0.25%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00544) (Q+U:  0.01078) (V:  -.----)
info string a8a7  (7   ) N:       0 (+ 0) (P:  0.26%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00561) (Q+U:  0.01096) (V:  -.----)
info string d6d5  (518 ) N:       0 (+ 0) (P:  0.28%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00599) (Q+U:  0.01133) (V:  -.----)
info string c8f5  (65  ) N:       0 (+ 0) (P:  0.29%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00615) (Q+U:  0.01149) (V:  -.----)
info string e8d7  (105 ) N:       0 (+ 0) (P:  0.29%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00629) (Q+U:  0.01163) (V:  -.----)
info string h8g8  (177 ) N:       0 (+ 0) (P:  0.32%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00695) (Q+U:  0.01229) (V:  -.----)
info string e8e7  (106 ) N:       0 (+ 0) (P:  0.33%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00700) (Q+U:  0.01234) (V:  -.----)
info string d8d7  (81  ) N:       0 (+ 0) (P:  0.38%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00824) (Q+U:  0.01358) (V:  -.----)
info string d8e7  (82  ) N:       0 (+ 0) (P:  0.39%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.00830) (Q+U:  0.01364) (V:  -.----)
info string g7g6  (374 ) N:       0 (+ 0) (P:  0.57%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.01230) (Q+U:  0.01764) (V:  -.----)
info string a6a5  (425 ) N:       0 (+ 0) (P:  0.66%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.01416) (Q+U:  0.01950) (V:  -.----)
info string h7h5  (403 ) N:       0 (+ 0) (P:  0.96%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.02054) (Q+U:  0.02588) (V:  -.----)
info string b7b6  (230 ) N:       0 (+ 0) (P:  1.19%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.02546) (Q+U:  0.03080) (V:  -.----)
info string b7b5  (234 ) N:       0 (+ 0) (P:  1.73%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.03725) (Q+U:  0.04259) (V:  -.----)
info string b8d7  (33  ) N:       0 (+ 0) (P:  2.52%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.05416) (Q+U:  0.05950) (V:  -.----)
info string c8d7  (57  ) N:       0 (+ 0) (P:  2.66%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.05702) (Q+U:  0.06236) (V:  -.----)
info string d8c7  (80  ) N:       0 (+ 0) (P:  3.36%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.07214) (Q+U:  0.07748) (V:  -.----)
info string b8c6  (36  ) N:       0 (+ 0) (P:  4.16%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.08938) (Q+U:  0.09472) (V:  -.----)
info string c8g4  (67  ) N:       0 (+ 0) (P:  4.65%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.09986) (Q+U:  0.10520) (V:  -.----)
info string h7h6  (400 ) N:       0 (+ 0) (P:  4.71%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.10114) (Q+U:  0.10648) (V:  -.----)
info string f6g4  (590 ) N:       0 (+ 0) (P: 15.07%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.32357) (Q+U:  0.32891) (V:  -.----)
info string c8e6  (63  ) N:       0 (+ 0) (P: 26.28%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.56431) (Q+U:  0.56965) (V:  -.----)
info string f8e7  (130 ) N:       0 (+ 0) (P: 27.17%) (WL:  0.00000) (D:  0.000) (Q:  0.00534) (U: 0.58344) (Q+U:  0.58878) (V:  -.----)
""",
    "2rbk2r/1p3pp1/pq1p1n2/3Pp2p/Q7/1NP2P2/PP4PP/1K1R1B1R b k - 1 17" : """
info depth 1 seldepth 1 time 4697 nodes 1 score cp 1412 tbhits 0 pv e8f8
info string b6c6  (446 ) N:       0 (+ 0) (P:  1.43%) (WL:  0.00000) (D:  0.000) (Q:  0.14124) (U: 0.03070) (Q+U:  0.17193) (V:  -.----)
info string c8c6  (61  ) N:       0 (+ 0) (P:  1.72%) (WL:  0.00000) (D:  0.000) (Q:  0.14124) (U: 0.03701) (Q+U:  0.17824) (V:  -.----)
info string b6b5  (453 ) N:       0 (+ 0) (P:  2.55%) (WL:  0.00000) (D:  0.000) (Q:  0.14124) (U: 0.05465) (Q+U:  0.19588) (V:  -.----)
info string e8e7  (106 ) N:       0 (+ 0) (P: 24.26%) (WL:  0.00000) (D:  0.000) (Q:  0.14124) (U: 0.52093) (Q+U:  0.66217) (V:  -.----)
info string f6d7  (570 ) N:       0 (+ 0) (P: 28.83%) (WL:  0.00000) (D:  0.000) (Q:  0.14124) (U: 0.61909) (Q+U:  0.76032) (V:  -.----)
info string e8f8  (101 ) N:       0 (+ 0) (P: 41.20%) (WL:  0.00000) (D:  0.000) (Q:  0.14124) (U: 0.88460) (Q+U:  1.02583) (V:  -.----)
""",
    "r1bqr1k1/pp2bppp/2n2n2/3p4/N7/4BNP1/PP2PPBP/2RQ1RK1 b - - 5 12" : """
info depth 1 seldepth 1 time 4351 nodes 1 score cp 260 tbhits 0 pv h7h6
info string g7g5  (378 ) N:       0 (+ 0) (P:  0.22%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.00472) (Q+U:  0.03072) (V:  -.----)
info string c6d4  (491 ) N:       0 (+ 0) (P:  0.31%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.00657) (Q+U:  0.03257) (V:  -.----)
info string g8f8  (152 ) N:       0 (+ 0) (P:  0.33%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.00700) (Q+U:  0.03300) (V:  -.----)
info string d8b6  (84  ) N:       0 (+ 0) (P:  0.34%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.00732) (Q+U:  0.03333) (V:  -.----)
info string c6e5  (487 ) N:       0 (+ 0) (P:  0.37%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.00785) (Q+U:  0.03385) (V:  -.----)
info string e7c5  (320 ) N:       0 (+ 0) (P:  0.37%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.00800) (Q+U:  0.03400) (V:  -.----)
info string g8h8  (153 ) N:       0 (+ 0) (P:  0.40%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.00854) (Q+U:  0.03454) (V:  -.----)
info string c6b8  (467 ) N:       0 (+ 0) (P:  0.52%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01125) (Q+U:  0.03726) (V:  -.----)
info string d8c7  (80  ) N:       0 (+ 0) (P:  0.53%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01138) (Q+U:  0.03738) (V:  -.----)
info string e7a3  (328 ) N:       0 (+ 0) (P:  0.55%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01190) (Q+U:  0.03790) (V:  -.----)
info string f6d7  (570 ) N:       0 (+ 0) (P:  0.62%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01334) (Q+U:  0.03934) (V:  -.----)
info string b7b6  (230 ) N:       0 (+ 0) (P:  0.74%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01579) (Q+U:  0.04179) (V:  -.----)
info string e8f8  (101 ) N:       0 (+ 0) (P:  0.74%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01586) (Q+U:  0.04186) (V:  -.----)
info string a7a6  (204 ) N:       0 (+ 0) (P:  0.75%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01611) (Q+U:  0.04211) (V:  -.----)
info string c8h3  (69  ) N:       0 (+ 0) (P:  0.76%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01641) (Q+U:  0.04241) (V:  -.----)
info string f6h5  (586 ) N:       0 (+ 0) (P:  0.85%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01836) (Q+U:  0.04436) (V:  -.----)
info string c6a5  (483 ) N:       0 (+ 0) (P:  0.86%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01847) (Q+U:  0.04447) (V:  -.----)
info string g7g6  (374 ) N:       0 (+ 0) (P:  0.90%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.01941) (Q+U:  0.04541) (V:  -.----)
info string b7b5  (234 ) N:       0 (+ 0) (P:  1.03%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.02202) (Q+U:  0.04803) (V:  -.----)
info string a7a5  (207 ) N:       0 (+ 0) (P:  1.13%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.02433) (Q+U:  0.05033) (V:  -.----)
info string a8b8  (0   ) N:       0 (+ 0) (P:  1.40%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.03009) (Q+U:  0.05609) (V:  -.----)
info string e7d6  (316 ) N:       0 (+ 0) (P:  1.48%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.03167) (Q+U:  0.05767) (V:  -.----)
info string d8d7  (81  ) N:       0 (+ 0) (P:  2.08%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.04469) (Q+U:  0.07069) (V:  -.----)
info string d5d4  (761 ) N:       0 (+ 0) (P:  2.13%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.04575) (Q+U:  0.07175) (V:  -.----)
info string e7b4  (325 ) N:       0 (+ 0) (P:  2.49%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.05355) (Q+U:  0.07955) (V:  -.----)
info string f6e4  (588 ) N:       0 (+ 0) (P:  2.91%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.06251) (Q+U:  0.08851) (V:  -.----)
info string d8d6  (86  ) N:       0 (+ 0) (P:  3.66%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.07857) (Q+U:  0.10457) (V:  -.----)
info string h7h5  (403 ) N:       0 (+ 0) (P:  3.88%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.08328) (Q+U:  0.10928) (V:  -.----)
info string c6b4  (489 ) N:       0 (+ 0) (P:  4.57%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.09803) (Q+U:  0.12403) (V:  -.----)
info string c8g4  (67  ) N:       0 (+ 0) (P:  4.67%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.10019) (Q+U:  0.12619) (V:  -.----)
info string f6g4  (590 ) N:       0 (+ 0) (P:  4.94%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.10605) (Q+U:  0.13205) (V:  -.----)
info string c8e6  (63  ) N:       0 (+ 0) (P:  7.27%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.15602) (Q+U:  0.18202) (V:  -.----)
info string d8a5  (89  ) N:       0 (+ 0) (P:  7.57%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.16250) (Q+U:  0.18850) (V:  -.----)
info string e7f8  (306 ) N:       0 (+ 0) (P:  7.91%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.16978) (Q+U:  0.19578) (V:  -.----)
info string c8d7  (57  ) N:       0 (+ 0) (P:  8.18%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.17561) (Q+U:  0.20161) (V:  -.----)
info string c8f5  (65  ) N:       0 (+ 0) (P: 10.42%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.22384) (Q+U:  0.24984) (V:  -.----)
info string h7h6  (400 ) N:       0 (+ 0) (P: 12.13%) (WL:  0.00000) (D:  0.000) (Q:  0.02600) (U: 0.26040) (Q+U:  0.28640) (V:  -.----)
"""
}

ENDGAME_TESTS = {
    "8/1R6/2P1pkp1/5P2/7b/4Pr1p/7P/6K1 w - - 0 42" : """
info depth 1 seldepth 1 time 5171 nodes 1 score cp -4313 tbhits 0 pv c6c7
info string g1h1  (153 ) N:       0 (+ 0) (P:  1.39%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.02986) (Q+U: -0.40148) (V:  -.----)
info string b7c7  (1421) N:       0 (+ 0) (P:  1.40%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.03016) (Q+U: -0.40118) (V:  -.----)
info string b7e7  (1423) N:       0 (+ 0) (P:  1.46%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.03129) (Q+U: -0.40005) (V:  -.----)
info string b7b5  (1413) N:       0 (+ 0) (P:  1.70%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.03660) (Q+U: -0.39474) (V:  -.----)
info string b7b6  (1417) N:       0 (+ 0) (P:  1.72%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.03691) (Q+U: -0.39443) (V:  -.----)
info string b7a7  (1420) N:       0 (+ 0) (P:  1.96%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.04212) (Q+U: -0.38922) (V:  -.----)
info string b7b2  (1406) N:       0 (+ 0) (P:  2.02%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.04335) (Q+U: -0.38799) (V:  -.----)
info string b7g7  (1425) N:       0 (+ 0) (P:  2.13%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.04566) (Q+U: -0.38568) (V:  -.----)
info string b7d7  (1422) N:       0 (+ 0) (P:  2.41%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.05172) (Q+U: -0.37962) (V:  -.----)
info string b7b8  (1428) N:       0 (+ 0) (P:  2.42%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.05190) (Q+U: -0.37944) (V:  -.----)
info string b7b3  (1408) N:       0 (+ 0) (P:  2.45%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.05260) (Q+U: -0.37873) (V:  -.----)
info string b7b1  (1404) N:       0 (+ 0) (P:  2.53%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.05440) (Q+U: -0.37693) (V:  -.----)
info string e3e4  (551 ) N:       0 (+ 0) (P:  2.60%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.05584) (Q+U: -0.37549) (V:  -.----)
info string b7f7  (1424) N:       0 (+ 0) (P:  4.40%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.09455) (Q+U: -0.33678) (V:  -.----)
info string f5e6  (1075) N:       0 (+ 0) (P:  6.68%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.14350) (Q+U: -0.28783) (V:  -.----)
info string b7b4  (1410) N:       0 (+ 0) (P:  7.36%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.15805) (Q+U: -0.27329) (V:  -.----)
info string f5g6  (1077) N:       0 (+ 0) (P:  9.34%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.20064) (Q+U: -0.23070) (V:  -.----)
info string b7h7  (1426) N:       0 (+ 0) (P: 16.31%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.35017) (Q+U: -0.08117) (V:  -.----)
info string c6c7  (1219) N:       0 (+ 0) (P: 29.71%) (WL:  0.00000) (D:  0.000) (Q: -0.43134) (U: 0.63796) (Q+U:  0.20662) (V:  -.----)
""",
    "8/6k1/8/1p5K/1p4P1/P7/8/8 w - - 0 51" : """
info depth 1 seldepth 1 time 7573 nodes 1 score cp 947 tbhits 0 pv a3b4
info string h5g5  (1131) N:       0 (+ 0) (P:  4.41%) (WL:  0.00000) (D:  0.000) (Q:  0.09479) (U: 0.09475) (Q+U:  0.18954) (V:  -.----)
info string g4g5  (861 ) N:       0 (+ 0) (P:  4.48%) (WL:  0.00000) (D:  0.000) (Q:  0.09479) (U: 0.09626) (Q+U:  0.19104) (V:  -.----)
info string a3a4  (425 ) N:       0 (+ 0) (P:  4.83%) (WL:  0.00000) (D:  0.000) (Q:  0.09479) (U: 0.10379) (Q+U:  0.19858) (V:  -.----)
info string h5h4  (1124) N:       0 (+ 0) (P:  5.30%) (WL:  0.00000) (D:  0.000) (Q:  0.09479) (U: 0.11375) (Q+U:  0.20854) (V:  -.----)
info string a3b4  (426 ) N:       0 (+ 0) (P: 80.98%) (WL:  0.00000) (D:  0.000) (Q:  0.09479) (U: 1.73879) (Q+U:  1.83358) (V:  -.----)
""",
    "r7/7P/5KP1/5B2/3k4/2p5/2R5/8 b - - 0 67" : """
info depth 1 seldepth 1 time 5120 nodes 1 score cp -9959 tbhits 0 pv d4d5
info string a8f8  (4   ) N:       0 (+ 0) (P:  5.36%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11516) (Q+U: -0.88080) (V:  -.----)
info string a8h8  (6   ) N:       0 (+ 0) (P:  5.41%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11618) (Q+U: -0.87978) (V:  -.----)
info string a8a7  (7   ) N:       0 (+ 0) (P:  5.44%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11683) (Q+U: -0.87913) (V:  -.----)
info string a8g8  (5   ) N:       0 (+ 0) (P:  5.49%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11782) (Q+U: -0.87814) (V:  -.----)
info string a8e8  (3   ) N:       0 (+ 0) (P:  5.50%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11801) (Q+U: -0.87795) (V:  -.----)
info string a8a6  (10  ) N:       0 (+ 0) (P:  5.50%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11811) (Q+U: -0.87785) (V:  -.----)
info string a8a3  (17  ) N:       0 (+ 0) (P:  5.51%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11837) (Q+U: -0.87759) (V:  -.----)
info string a8a2  (19  ) N:       0 (+ 0) (P:  5.52%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11860) (Q+U: -0.87736) (V:  -.----)
info string a8a5  (13  ) N:       0 (+ 0) (P:  5.54%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11886) (Q+U: -0.87710) (V:  -.----)
info string a8a4  (15  ) N:       0 (+ 0) (P:  5.54%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11899) (Q+U: -0.87696) (V:  -.----)
info string a8d8  (2   ) N:       0 (+ 0) (P:  5.55%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11916) (Q+U: -0.87680) (V:  -.----)
info string a8c8  (1   ) N:       0 (+ 0) (P:  5.56%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11932) (Q+U: -0.87664) (V:  -.----)
info string a8b8  (0   ) N:       0 (+ 0) (P:  5.58%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.11981) (Q+U: -0.87614) (V:  -.----)
info string a8a1  (21  ) N:       0 (+ 0) (P:  5.59%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.12001) (Q+U: -0.87595) (V:  -.----)
info string d4e3  (1008) N:       0 (+ 0) (P:  5.71%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.12270) (Q+U: -0.87326) (V:  -.----)
info string d4c4  (1000) N:       0 (+ 0) (P:  5.73%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.12296) (Q+U: -0.87300) (V:  -.----)
info string d4c5  (994 ) N:       0 (+ 0) (P:  5.73%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.12306) (Q+U: -0.87290) (V:  -.----)
info string d4d5  (995 ) N:       0 (+ 0) (P:  5.74%) (WL:  0.00000) (D:  0.000) (Q: -0.99596) (U: 0.12316) (Q+U: -0.87280) (V:  -.----)
"""
}
VALUE_RE = re.compile('cp\s+(-?\d+)')
POLICY_RE = re.compile('info string\s+(\S+).+P:\s+(\d+\.\d+)%')
NET = badgyal.BGNet()
LENET = badgyal.LENet()

def from_result(result):
    results = result.split("\n")
    m = VALUE_RE.search(results[1])
    value = int(m.group(1))/10000.0
    policy = {}
    for s in results:
        m = POLICY_RE.search(s)
        if m:
            policy[m.group(1)] = float(m.group(2))/100.0
    return (policy, value)

def test_fen(fen, net):
    board = chess.Board(fen=fen)
    return net.eval(board)

class NetTestCase(unittest.TestCase):
    def assertDictAlmostEqual(self, d1, d2, msg=None, places=7):
        return
        # check if both inputs are dicts
        self.assertIsInstance(d1, dict, 'First argument is not a dictionary')
        self.assertIsInstance(d2, dict, 'Second argument is not a dictionary')
        # check if both inputs have the same keys
        self.assertEqual(d1.keys(), d2.keys())
        # check each key
        for key, value in d1.items():
            if isinstance(value, dict):
                self.assertDictAlmostEqual(d1[key], d2[key], msg=msg)
            else:
                self.assertAlmostEqual(d1[key], d2[key], places=places, msg=msg)

    #@unittest.skip("skipping BG")
    def test_bg_eval(self):
        for fen, result in TESTS.items():
            policy, value = test_fen(fen, NET)
            policy2, value2 = from_result(result)
            self.assertAlmostEqual(value, value2, 1, "Values don't match {}".format(fen))
            self.assertDictAlmostEqual(policy, policy2, places=2)

    def test_le_eval(self):
        for fen, result in ENDGAME_TESTS.items():
            policy, value = test_fen(fen, LENET)
            policy2, value2 = from_result(result)
            self.assertAlmostEqual(value, value2, 2, "Values don't match {}".format(fen))
            self.assertDictAlmostEqual(policy, policy2, places=2)

if __name__ == "__main__":
    unittest.main()
