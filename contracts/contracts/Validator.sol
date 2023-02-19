// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";

interface Hasher {
    function poseidon(uint256[2] calldata leftRight)
        external
        pure
        returns (uint256);
}

contract Validator {

    Hasher public poseidonContract;
    address public chessContract;
    address public verifierContract;
    uint256 public inputHash;
    uint256 public outputHash;
    uint16[] public legalMoveIndicies;
    int16 public nextLegalMoveIndex;
    uint public winningMoveIndex;
    int256 public winningMoveValue;
    uint public lastChunkEndIndex;

    uint public constant INPUT_LEN = 112;
    uint public constant OUTPUT_LEN = 1858;

    int256 public constant MODULUS = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;
    uint256 public constant TWO_INV = 0x183227397098d014dc2822db40c0ac2e9419f4243cdcb848a1f0fac9f8000001;

    uint16[1858] public moveMapArray = [3641,3642,3643,3644,3645,3646,3647,3632,3633,3634,3624,3625,3626,3616,3619,3608,3612,3600,3605,3592,3598,3584,3591,3704,3706,3707,3708,3709,3710,3711,3696,3697,3698,3699,3688,3689,3690,3691,3681,3684,3673,3677,3665,3670,3657,3663,3649,3768,3769,3771,3772,3773,3774,3775,3760,3761,3762,3763,3764,3752,3753,3754,3755,3756,3746,3749,3738,3742,3730,3735,3722,3714,3832,3833,3834,3836,3837,3838,3839,3825,3826,3827,3828,3829,3817,3818,3819,3820,3821,3808,3811,3814,3803,3807,3795,3787,3779,3896,3897,3898,3899,3901,3902,3903,3890,3891,3892,3893,3894,3882,3883,3884,3885,3886,3873,3876,3879,3864,3868,3860,3852,3844,3960,3961,3962,3963,3964,3966,3967,3955,3956,3957,3958,3959,3947,3948,3949,3950,3951,3938,3941,3929,3933,3920,3925,3917,3909,4024,4025,4026,4027,4028,4029,4031,4020,4021,4022,4023,4012,4013,4014,4015,4003,4006,3994,3998,3985,3990,3976,3982,3974,4088,4089,4090,4091,4092,4093,4094,4085,4086,4087,4077,4078,4079,4068,4071,4059,4063,4050,4055,4041,4047,4032,4039,3128,3129,3130,3121,3122,3123,3124,3125,3126,3127,3112,3113,3114,3104,3105,3106,3096,3099,3088,3092,3080,3085,3072,3078,3192,3193,3194,3195,3184,3186,3187,3188,3189,3190,3191,3176,3177,3178,3179,3168,3169,3170,3171,3161,3164,3153,3157,3145,3150,3137,3143,3256,3257,3258,3259,3260,3248,3249,3251,3252,3253,3254,3255,3240,3241,3242,3243,3244,3232,3233,3234,3235,3236,3226,3229,3218,3222,3210,3215,3202,3321,3322,3323,3324,3325,3312,3313,3314,3316,3317,3318,3319,3305,3306,3307,3308,3309,3297,3298,3299,3300,3301,3288,3291,3294,3283,3287,3275,3267,3386,3387,3388,3389,3390,3376,3377,3378,3379,3381,3382,3383,3370,3371,3372,3373,3374,3362,3363,3364,3365,3366,3353,3356,3359,3344,3348,3340,3332,3451,3452,3453,3454,3455,3440,3441,3442,3443,3444,3446,3447,3435,3436,3437,3438,3439,3427,3428,3429,3430,3431,3418,3421,3409,3413,3400,3405,3397,3516,3517,3518,3519,3504,3505,3506,3507,3508,3509,3511,3500,3501,3502,3503,3492,3493,3494,3495,3483,3486,3474,3478,3465,3470,3456,3462,3581,3582,3583,3568,3569,3570,3571,3572,3573,3574,3565,3566,3567,3557,3558,3559,3548,3551,3539,3543,3530,3535,3521,3527,2616,2617,2618,2608,2609,2610,2601,2602,2603,2604,2605,2606,2607,2592,2593,2594,2584,2585,2586,2576,2579,2568,2572,2560,2565,2680,2681,2682,2683,2672,2673,2674,2675,2664,2666,2667,2668,2669,2670,2671,2656,2657,2658,2659,2648,2649,2650,2651,2641,2644,2633,2637,2625,2630,2744,2745,2746,2747,2748,2736,2737,2738,2739,2740,2728,2729,2731,2732,2733,2734,2735,2720,2721,2722,2723,2724,2712,2713,2714,2715,2716,2706,2709,2698,2702,2690,2695,2809,2810,2811,2812,2813,2801,2802,2803,2804,2805,2792,2793,2794,2796,2797,2798,2799,2785,2786,2787,2788,2789,2777,2778,2779,2780,2781,2768,2771,2774,2763,2767,2755,2874,2875,2876,2877,2878,2866,2867,2868,2869,2870,2856,2857,2858,2859,2861,2862,2863,2850,2851,2852,2853,2854,2842,2843,2844,2845,2846,2833,2836,2839,2824,2828,2820,2939,2940,2941,2942,2943,2931,2932,2933,2934,2935,2920,2921,2922,2923,2924,2926,2927,2915,2916,2917,2918,2919,2907,2908,2909,2910,2911,2898,2901,2889,2893,2880,2885,3004,3005,3006,3007,2996,2997,2998,2999,2984,2985,2986,2987,2988,2989,2991,2980,2981,2982,2983,2972,2973,2974,2975,2963,2966,2954,2958,2945,2950,3069,3070,3071,3061,3062,3063,3048,3049,3050,3051,3052,3053,3054,3045,3046,3047,3037,3038,3039,3028,3031,3019,3023,3010,3015,2104,2107,2096,2097,2098,2088,2089,2090,2081,2082,2083,2084,2085,2086,2087,2072,2073,2074,2064,2065,2066,2056,2059,2048,2052,2169,2172,2160,2161,2162,2163,2152,2153,2154,2155,2144,2146,2147,2148,2149,2150,2151,2136,2137,2138,2139,2128,2129,2130,2131,2121,2124,2113,2117,2234,2237,2224,2225,2226,2227,2228,2216,2217,2218,2219,2220,2208,2209,2211,2212,2213,2214,2215,2200,2201,2202,2203,2204,2192,2193,2194,2195,2196,2186,2189,2178,2182,2296,2299,2302,2289,2290,2291,2292,2293,2281,2282,2283,2284,2285,2272,2273,2274,2276,2277,2278,2279,2265,2266,2267,2268,2269,2257,2258,2259,2260,2261,2248,2251,2254,2243,2247,2361,2364,2367,2354,2355,2356,2357,2358,2346,2347,2348,2349,2350,2336,2337,2338,2339,2341,2342,2343,2330,2331,2332,2333,2334,2322,2323,2324,2325,2326,2313,2316,2319,2304,2308,2426,2429,2419,2420,2421,2422,2423,2411,2412,2413,2414,2415,2400,2401,2402,2403,2404,2406,2407,2395,2396,2397,2398,2399,2387,2388,2389,2390,2391,2378,2381,2369,2373,2491,2494,2484,2485,2486,2487,2476,2477,2478,2479,2464,2465,2466,2467,2468,2469,2471,2460,2461,2462,2463,2452,2453,2454,2455,2443,2446,2434,2438,2556,2559,2549,2550,2551,2541,2542,2543,2528,2529,2530,2531,2532,2533,2534,2525,2526,2527,2517,2518,2519,2508,2511,2499,2503,1592,1596,1584,1587,1576,1577,1578,1568,1569,1570,1561,1562,1563,1564,1565,1566,1567,1552,1553,1554,1544,1545,1546,1536,1539,1657,1661,1649,1652,1640,1641,1642,1643,1632,1633,1634,1635,1624,1626,1627,1628,1629,1630,1631,1616,1617,1618,1619,1608,1609,1610,1611,1601,1604,1722,1726,1714,1717,1704,1705,1706,1707,1708,1696,1697,1698,1699,1700,1688,1689,1691,1692,1693,1694,1695,1680,1681,1682,1683,1684,1672,1673,1674,1675,1676,1666,1669,1787,1791,1776,1779,1782,1769,1770,1771,1772,1773,1761,1762,1763,1764,1765,1752,1753,1754,1756,1757,1758,1759,1745,1746,1747,1748,1749,1737,1738,1739,1740,1741,1728,1731,1734,1848,1852,1841,1844,1847,1834,1835,1836,1837,1838,1826,1827,1828,1829,1830,1816,1817,1818,1819,1821,1822,1823,1810,1811,1812,1813,1814,1802,1803,1804,1805,1806,1793,1796,1799,1913,1917,1906,1909,1899,1900,1901,1902,1903,1891,1892,1893,1894,1895,1880,1881,1882,1883,1884,1886,1887,1875,1876,1877,1878,1879,1867,1868,1869,1870,1871,1858,1861,1978,1982,1971,1974,1964,1965,1966,1967,1956,1957,1958,1959,1944,1945,1946,1947,1948,1949,1951,1940,1941,1942,1943,1932,1933,1934,1935,1923,1926,2043,2047,2036,2039,2029,2030,2031,2021,2022,2023,2008,2009,2010,2011,2012,2013,2014,2005,2006,2007,1997,1998,1999,1988,1991,1080,1085,1072,1076,1064,1067,1056,1057,1058,1048,1049,1050,1041,1042,1043,1044,1045,1046,1047,1032,1033,1034,1024,1025,1026,1145,1150,1137,1141,1129,1132,1120,1121,1122,1123,1112,1113,1114,1115,1104,1106,1107,1108,1109,1110,1111,1096,1097,1098,1099,1088,1089,1090,1091,1210,1215,1202,1206,1194,1197,1184,1185,1186,1187,1188,1176,1177,1178,1179,1180,1168,1169,1171,1172,1173,1174,1175,1160,1161,1162,1163,1164,1152,1153,1154,1155,1156,1275,1267,1271,1256,1259,1262,1249,1250,1251,1252,1253,1241,1242,1243,1244,1245,1232,1233,1234,1236,1237,1238,1239,1225,1226,1227,1228,1229,1217,1218,1219,1220,1221,1340,1328,1332,1321,1324,1327,1314,1315,1316,1317,1318,1306,1307,1308,1309,1310,1296,1297,1298,1299,1301,1302,1303,1290,1291,1292,1293,1294,1282,1283,1284,1285,1286,1400,1405,1393,1397,1386,1389,1379,1380,1381,1382,1383,1371,1372,1373,1374,1375,1360,1361,1362,1363,1364,1366,1367,1355,1356,1357,1358,1359,1347,1348,1349,1350,1351,1465,1470,1458,1462,1451,1454,1444,1445,1446,1447,1436,1437,1438,1439,1424,1425,1426,1427,1428,1429,1431,1420,1421,1422,1423,1412,1413,1414,1415,1530,1535,1523,1527,1516,1519,1509,1510,1511,1501,1502,1503,1488,1489,1490,1491,1492,1493,1494,1485,1486,1487,1477,1478,1479,568,574,560,565,552,556,544,547,536,537,538,528,529,530,521,522,523,524,525,526,527,512,513,514,633,639,625,630,617,621,609,612,600,601,602,603,592,593,594,595,584,586,587,588,589,590,591,576,577,578,579,698,690,695,682,686,674,677,664,665,666,667,668,656,657,658,659,660,648,649,651,652,653,654,655,640,641,642,643,644,763,755,747,751,736,739,742,729,730,731,732,733,721,722,723,724,725,712,713,714,716,717,718,719,705,706,707,708,709,828,820,808,812,801,804,807,794,795,796,797,798,786,787,788,789,790,776,777,778,779,781,782,783,770,771,772,773,774,893,880,885,873,877,866,869,859,860,861,862,863,851,852,853,854,855,840,841,842,843,844,846,847,835,836,837,838,839,952,958,945,950,938,942,931,934,924,925,926,927,916,917,918,919,904,905,906,907,908,909,911,900,901,902,903,1017,1023,1010,1015,1003,1007,996,999,989,990,991,981,982,983,968,969,970,971,972,973,974,965,966,967,56,63,48,54,40,45,32,36,24,27,16,17,18,8,9,10,1,2,3,4,5,6,7,121,113,119,105,110,97,101,89,92,80,81,82,83,72,73,74,75,64,66,67,68,69,70,71,186,178,170,175,162,166,154,157,144,145,146,147,148,136,137,138,139,140,128,129,131,132,133,134,135,251,243,235,227,231,216,219,222,209,210,211,212,213,201,202,203,204,205,192,193,194,196,197,198,199,316,308,300,288,292,281,284,287,274,275,276,277,278,266,267,268,269,270,256,257,258,259,261,262,263,381,373,360,365,353,357,346,349,339,340,341,342,343,331,332,333,334,335,320,321,322,323,324,326,327,446,432,438,425,430,418,422,411,414,404,405,406,407,396,397,398,399,384,385,386,387,388,389,391,504,511,497,503,490,495,483,487,476,479,469,470,471,461,462,463,448,449,450,451,452,453,454,512,512,512,513,513,513,576,576,576,577,577,577,578,578,578,641,641,641,642,642,642,643,643,643,706,706,706,707,707,707,708,708,708,771,771,771,772,772,772,773,773,773,836,836,836,837,837,837,838,838,838,901,901,901,902,902,902,903,903,903,966,966,966,967,967,967];

    uint16[4095] public reverseMoveMap = [0,1614,1615,1616,1617,1618,1619,1620,1611,1612,1613,0,0,0,0,0,1608,1609,1610,0,0,0,0,0,1606,0,0,1607,0,0,0,0,1604,0,0,0,1605,0,0,0,1602,0,0,0,0,1603,0,0,1600,0,0,0,0,0,1601,0,1598,0,0,0,0,0,0,1599,1638,0,1639,1640,1641,1642,1643,1644,1634,1635,1636,1637,0,0,0,0,1630,1631,1632,1633,0,0,0,0,0,1628,0,0,1629,0,0,0,0,1626,0,0,0,1627,0,0,0,1624,0,0,0,0,1625,0,0,1622,0,0,0,0,0,1623,0,1621,0,0,0,0,0,0,1663,1664,0,1665,1666,1667,1668,1669,1658,1659,1660,1661,1662,0,0,0,1653,1654,1655,1656,1657,0,0,0,0,0,1651,0,0,1652,0,0,0,0,1649,0,0,0,1650,0,0,0,1647,0,0,0,0,1648,0,0,1646,0,0,0,0,0,0,0,1645,0,0,0,0,0,1688,1689,1690,0,1691,1692,1693,1694,0,1683,1684,1685,1686,1687,0,0,0,1678,1679,1680,1681,1682,0,0,1675,0,0,1676,0,0,1677,0,0,0,0,1673,0,0,0,1674,0,0,0,1672,0,0,0,0,0,0,0,1671,0,0,0,0,0,0,0,1670,0,0,0,0,1713,1714,1715,1716,0,1717,1718,1719,0,0,1708,1709,1710,1711,1712,0,0,0,1703,1704,1705,1706,1707,0,0,1700,0,0,1701,0,0,1702,1698,0,0,0,1699,0,0,0,0,0,0,0,1697,0,0,0,0,0,0,0,1696,0,0,0,0,0,0,0,1695,0,0,0,1738,1739,1740,1741,1742,0,1743,1744,0,0,0,1733,1734,1735,1736,1737,0,0,0,1728,1729,1730,1731,1732,0,0,1726,0,0,1727,0,0,0,1724,0,0,0,1725,0,0,1722,0,0,0,0,1723,0,0,0,0,0,0,0,1721,0,0,0,0,0,0,0,1720,0,0,1762,1763,1764,1765,1766,1767,0,1768,0,0,0,0,1758,1759,1760,1761,0,0,0,0,1754,1755,1756,1757,0,0,0,1752,0,0,1753,0,0,0,1750,0,0,0,1751,0,0,1748,0,0,0,0,1749,0,1746,0,0,0,0,0,1747,0,0,0,0,0,0,0,1745,0,1785,1786,1787,1788,1789,1790,1791,0,0,0,0,0,0,1782,1783,1784,0,0,0,0,0,1779,1780,1781,0,0,0,0,1777,0,0,1778,0,0,0,1775,0,0,0,1776,0,0,1773,0,0,0,0,1774,0,1771,0,0,0,0,0,1772,1769,0,0,0,0,0,0,1770,1794,1797,1403,0,0,0,0,0,0,1394,1395,1396,1397,1398,1399,1400,1391,1392,1393,0,0,0,0,0,1388,1389,1390,0,0,0,0,0,1386,0,0,1387,0,0,0,0,1384,0,0,0,1385,0,0,0,1382,0,0,0,0,1383,0,0,1380,0,0,0,0,0,1381,0,1800,1803,1806,1430,0,0,0,0,1420,0,1421,1422,1423,1424,1425,1426,1416,1417,1418,1419,0,0,0,0,1412,1413,1414,1415,0,0,0,0,0,1410,0,0,1411,0,0,0,0,1408,0,0,0,1409,0,0,0,1406,0,0,0,0,1407,0,0,1404,0,0,0,0,0,1405,1455,1809,1812,1815,1459,0,0,0,1448,1449,0,1450,1451,1452,1453,1454,1443,1444,1445,1446,1447,0,0,0,1438,1439,1440,1441,1442,0,0,0,0,0,1436,0,0,1437,0,0,0,0,1434,0,0,0,1435,0,0,0,1432,0,0,0,0,1433,0,0,1431,0,0,0,0,0,0,1484,1818,1821,1824,1488,0,0,1477,1478,1479,0,1480,1481,1482,1483,0,1472,1473,1474,1475,1476,0,0,0,1467,1468,1469,1470,1471,0,0,1464,0,0,1465,0,0,1466,0,0,0,0,1462,0,0,0,1463,0,0,0,1461,0,0,0,0,0,0,0,1460,0,0,0,0,0,0,1513,1827,1830,1833,1517,0,1506,1507,1508,1509,0,1510,1511,1512,0,0,1501,1502,1503,1504,1505,0,0,0,1496,1497,1498,1499,1500,0,0,1493,0,0,1494,0,0,1495,1491,0,0,0,1492,0,0,0,0,0,0,0,1490,0,0,0,0,0,0,0,1489,0,0,0,0,0,0,1542,1836,1839,1842,1546,1535,1536,1537,1538,1539,0,1540,1541,0,0,0,1530,1531,1532,1533,1534,0,0,0,1525,1526,1527,1528,1529,0,0,1523,0,0,1524,0,0,0,1521,0,0,0,1522,0,0,1519,0,0,0,0,1520,0,0,0,0,0,0,0,1518,0,0,0,0,0,0,1570,1845,1848,1851,1563,1564,1565,1566,1567,1568,0,1569,0,0,0,0,1559,1560,1561,1562,0,0,0,0,1555,1556,1557,1558,0,0,0,1553,0,0,1554,0,0,0,1551,0,0,0,1552,0,0,1549,0,0,0,0,1550,0,1547,0,0,0,0,0,1548,0,0,0,0,0,0,1595,1854,1857,1588,1589,1590,1591,1592,1593,1594,0,0,0,0,0,0,1585,1586,1587,0,0,0,0,0,1582,1583,1584,0,0,0,0,1580,0,0,1581,0,0,0,1578,0,0,0,1579,0,0,1576,0,0,0,0,1577,0,1574,0,0,0,0,0,1575,1162,1163,1164,0,0,0,0,0,1159,1160,1161,0,0,0,0,0,0,1152,1153,1154,1155,1156,1157,1158,1149,1150,1151,0,0,0,0,0,1146,1147,1148,0,0,0,0,0,1144,0,0,1145,0,0,0,0,1142,0,0,0,1143,0,0,0,1140,0,0,0,0,1141,0,0,1190,1191,1192,1193,0,0,0,0,1186,1187,1188,1189,0,0,0,0,1179,0,1180,1181,1182,1183,1184,1185,1175,1176,1177,1178,0,0,0,0,1171,1172,1173,1174,0,0,0,0,0,1169,0,0,1170,0,0,0,0,1167,0,0,0,1168,0,0,0,1165,0,0,0,0,1166,0,1222,1223,1224,1225,1226,0,0,0,1217,1218,1219,1220,1221,0,0,0,1210,1211,0,1212,1213,1214,1215,1216,1205,1206,1207,1208,1209,0,0,0,1200,1201,1202,1203,1204,0,0,0,0,0,1198,0,0,1199,0,0,0,0,1196,0,0,0,1197,0,0,0,1194,0,0,0,0,1195,0,1255,1256,1257,1258,1259,0,0,0,1250,1251,1252,1253,1254,0,0,1243,1244,1245,0,1246,1247,1248,1249,0,1238,1239,1240,1241,1242,0,0,0,1233,1234,1235,1236,1237,0,0,1230,0,0,1231,0,0,1232,0,0,0,0,1228,0,0,0,1229,0,0,0,1227,0,0,0,0,0,0,1288,1289,1290,1291,1292,0,0,0,1283,1284,1285,1286,1287,0,1276,1277,1278,1279,0,1280,1281,1282,0,0,1271,1272,1273,1274,1275,0,0,0,1266,1267,1268,1269,1270,0,0,1263,0,0,1264,0,0,1265,1261,0,0,0,1262,0,0,0,0,0,0,0,1260,0,0,0,0,0,0,1321,1322,1323,1324,1325,0,0,0,1316,1317,1318,1319,1320,1309,1310,1311,1312,1313,0,1314,1315,0,0,0,1304,1305,1306,1307,1308,0,0,0,1299,1300,1301,1302,1303,0,0,1297,0,0,1298,0,0,0,1295,0,0,0,1296,0,0,1293,0,0,0,0,1294,0,0,0,0,0,0,1351,1352,1353,1354,0,0,0,0,1347,1348,1349,1350,1340,1341,1342,1343,1344,1345,0,1346,0,0,0,0,1336,1337,1338,1339,0,0,0,0,1332,1333,1334,1335,0,0,0,1330,0,0,1331,0,0,0,1328,0,0,0,1329,0,0,1326,0,0,0,0,1327,0,0,0,0,0,0,1377,1378,1379,0,0,0,0,0,1374,1375,1376,1367,1368,1369,1370,1371,1372,1373,0,0,0,0,0,0,1364,1365,1366,0,0,0,0,0,1361,1362,1363,0,0,0,0,1359,0,0,1360,0,0,0,1357,0,0,0,1358,0,0,1355,0,0,0,0,1356,919,0,0,920,0,0,0,0,916,917,918,0,0,0,0,0,913,914,915,0,0,0,0,0,0,906,907,908,909,910,911,912,903,904,905,0,0,0,0,0,900,901,902,0,0,0,0,0,898,0,0,899,0,0,0,0,896,0,0,0,897,0,0,0,0,948,0,0,949,0,0,0,944,945,946,947,0,0,0,0,940,941,942,943,0,0,0,0,933,0,934,935,936,937,938,939,929,930,931,932,0,0,0,0,925,926,927,928,0,0,0,0,0,923,0,0,924,0,0,0,0,921,0,0,0,922,0,0,0,0,981,0,0,982,0,0,976,977,978,979,980,0,0,0,971,972,973,974,975,0,0,0,964,965,0,966,967,968,969,970,959,960,961,962,963,0,0,0,954,955,956,957,958,0,0,0,0,0,952,0,0,953,0,0,0,0,950,0,0,0,951,0,1015,0,0,1016,0,0,1017,0,0,1010,1011,1012,1013,1014,0,0,0,1005,1006,1007,1008,1009,0,0,998,999,1000,0,1001,1002,1003,1004,0,993,994,995,996,997,0,0,0,988,989,990,991,992,0,0,985,0,0,986,0,0,987,0,0,0,0,983,0,0,0,984,0,1050,0,0,1051,0,0,1052,0,0,1045,1046,1047,1048,1049,0,0,0,1040,1041,1042,1043,1044,0,1033,1034,1035,1036,0,1037,1038,1039,0,0,1028,1029,1030,1031,1032,0,0,0,1023,1024,1025,1026,1027,0,0,1020,0,0,1021,0,0,1022,1018,0,0,0,1019,0,0,0,0,0,1084,0,0,1085,0,0,0,0,0,1079,1080,1081,1082,1083,0,0,0,1074,1075,1076,1077,1078,1067,1068,1069,1070,1071,0,1072,1073,0,0,0,1062,1063,1064,1065,1066,0,0,0,1057,1058,1059,1060,1061,0,0,1055,0,0,1056,0,0,0,1053,0,0,0,1054,0,0,0,0,0,1113,0,0,1114,0,0,0,0,0,1109,1110,1111,1112,0,0,0,0,1105,1106,1107,1108,1098,1099,1100,1101,1102,1103,0,1104,0,0,0,0,1094,1095,1096,1097,0,0,0,0,1090,1091,1092,1093,0,0,0,1088,0,0,1089,0,0,0,1086,0,0,0,1087,0,0,0,0,0,1138,0,0,1139,0,0,0,0,0,1135,1136,1137,0,0,0,0,0,1132,1133,1134,1125,1126,1127,1128,1129,1130,1131,0,0,0,0,0,0,1122,1123,1124,0,0,0,0,0,1119,1120,1121,0,0,0,0,1117,0,0,1118,0,0,0,1115,0,0,0,1116,675,0,0,0,676,0,0,0,673,0,0,674,0,0,0,0,670,671,672,0,0,0,0,0,667,668,669,0,0,0,0,0,0,660,661,662,663,664,665,666,657,658,659,0,0,0,0,0,654,655,656,0,0,0,0,0,652,0,0,653,0,0,0,0,0,704,0,0,0,705,0,0,0,702,0,0,703,0,0,0,698,699,700,701,0,0,0,0,694,695,696,697,0,0,0,0,687,0,688,689,690,691,692,693,683,684,685,686,0,0,0,0,679,680,681,682,0,0,0,0,0,677,0,0,678,0,0,0,0,0,737,0,0,0,738,0,0,0,735,0,0,736,0,0,730,731,732,733,734,0,0,0,725,726,727,728,729,0,0,0,718,719,0,720,721,722,723,724,713,714,715,716,717,0,0,0,708,709,710,711,712,0,0,0,0,0,706,0,0,707,0,0,0,0,0,772,0,0,0,773,769,0,0,770,0,0,771,0,0,764,765,766,767,768,0,0,0,759,760,761,762,763,0,0,752,753,754,0,755,756,757,758,0,747,748,749,750,751,0,0,0,742,743,744,745,746,0,0,739,0,0,740,0,0,741,0,807,0,0,0,808,0,0,0,0,804,0,0,805,0,0,806,0,0,799,800,801,802,803,0,0,0,794,795,796,797,798,0,787,788,789,790,0,791,792,793,0,0,782,783,784,785,786,0,0,0,777,778,779,780,781,0,0,774,0,0,775,0,0,776,0,840,0,0,0,841,0,0,0,0,838,0,0,839,0,0,0,0,0,833,834,835,836,837,0,0,0,828,829,830,831,832,821,822,823,824,825,0,826,827,0,0,0,816,817,818,819,820,0,0,0,811,812,813,814,815,0,0,809,0,0,810,0,0,0,0,869,0,0,0,870,0,0,0,0,867,0,0,868,0,0,0,0,0,863,864,865,866,0,0,0,0,859,860,861,862,852,853,854,855,856,857,0,858,0,0,0,0,848,849,850,851,0,0,0,0,844,845,846,847,0,0,0,842,0,0,843,0,0,0,0,894,0,0,0,895,0,0,0,0,892,0,0,893,0,0,0,0,0,889,890,891,0,0,0,0,0,886,887,888,879,880,881,882,883,884,885,0,0,0,0,0,0,876,877,878,0,0,0,0,0,873,874,875,0,0,0,0,871,0,0,872,435,0,0,0,0,436,0,0,433,0,0,0,434,0,0,0,431,0,0,432,0,0,0,0,428,429,430,0,0,0,0,0,425,426,427,0,0,0,0,0,0,418,419,420,421,422,423,424,415,416,417,0,0,0,0,0,412,413,414,0,0,0,0,0,0,464,0,0,0,0,465,0,0,462,0,0,0,463,0,0,0,460,0,0,461,0,0,0,456,457,458,459,0,0,0,0,452,453,454,455,0,0,0,0,445,0,446,447,448,449,450,451,441,442,443,444,0,0,0,0,437,438,439,440,0,0,0,0,0,0,497,0,0,0,0,498,0,0,495,0,0,0,496,0,0,0,493,0,0,494,0,0,488,489,490,491,492,0,0,0,483,484,485,486,487,0,0,0,476,477,0,478,479,480,481,482,471,472,473,474,475,0,0,0,466,467,468,469,470,0,0,0,0,0,0,531,0,0,0,0,0,0,0,529,0,0,0,530,526,0,0,527,0,0,528,0,0,521,522,523,524,525,0,0,0,516,517,518,519,520,0,0,509,510,511,0,512,513,514,515,0,504,505,506,507,508,0,0,0,499,500,501,502,503,0,0,0,0,0,0,564,0,0,0,562,0,0,0,563,0,0,0,0,559,0,0,560,0,0,561,0,0,554,555,556,557,558,0,0,0,549,550,551,552,553,0,542,543,544,545,0,546,547,548,0,0,537,538,539,540,541,0,0,0,532,533,534,535,536,0,596,0,0,0,0,597,0,0,0,594,0,0,0,595,0,0,0,0,592,0,0,593,0,0,0,0,0,587,588,589,590,591,0,0,0,582,583,584,585,586,575,576,577,578,579,0,580,581,0,0,0,570,571,572,573,574,0,0,0,565,566,567,568,569,0,625,0,0,0,0,626,0,0,0,623,0,0,0,624,0,0,0,0,621,0,0,622,0,0,0,0,0,617,618,619,620,0,0,0,0,613,614,615,616,606,607,608,609,610,611,0,612,0,0,0,0,602,603,604,605,0,0,0,0,598,599,600,601,0,0,650,0,0,0,0,651,0,0,0,648,0,0,0,649,0,0,0,0,646,0,0,647,0,0,0,0,0,643,644,645,0,0,0,0,0,640,641,642,633,634,635,636,637,638,639,0,0,0,0,0,0,630,631,632,0,0,0,0,0,627,628,629,216,0,0,0,0,0,217,0,214,0,0,0,0,215,0,0,212,0,0,0,213,0,0,0,210,0,0,211,0,0,0,0,207,208,209,0,0,0,0,0,204,205,206,0,0,0,0,0,0,197,198,199,200,201,202,203,194,195,196,0,0,0,0,0,0,243,0,0,0,0,0,244,0,241,0,0,0,0,242,0,0,239,0,0,0,240,0,0,0,237,0,0,238,0,0,0,233,234,235,236,0,0,0,0,229,230,231,232,0,0,0,0,222,0,223,224,225,226,227,228,218,219,220,221,0,0,0,0,0,0,273,0,0,0,0,0,0,0,271,0,0,0,0,272,0,0,269,0,0,0,270,0,0,0,267,0,0,268,0,0,262,263,264,265,266,0,0,0,257,258,259,260,261,0,0,0,250,251,0,252,253,254,255,256,245,246,247,248,249,0,0,0,0,0,0,302,0,0,0,0,0,0,0,301,0,0,0,0,0,0,0,299,0,0,0,300,296,0,0,297,0,0,298,0,0,291,292,293,294,295,0,0,0,286,287,288,289,290,0,0,279,280,281,0,282,283,284,285,0,274,275,276,277,278,0,0,0,0,0,0,331,0,0,0,0,0,0,0,330,0,0,0,328,0,0,0,329,0,0,0,0,325,0,0,326,0,0,327,0,0,320,321,322,323,324,0,0,0,315,316,317,318,319,0,308,309,310,311,0,312,313,314,0,0,303,304,305,306,307,0,0,0,0,0,0,360,0,0,358,0,0,0,0,359,0,0,0,356,0,0,0,357,0,0,0,0,354,0,0,355,0,0,0,0,0,349,350,351,352,353,0,0,0,344,345,346,347,348,337,338,339,340,341,0,342,343,0,0,0,332,333,334,335,336,386,0,0,0,0,0,387,0,0,384,0,0,0,0,385,0,0,0,382,0,0,0,383,0,0,0,0,380,0,0,381,0,0,0,0,0,376,377,378,379,0,0,0,0,372,373,374,375,365,366,367,368,369,370,0,371,0,0,0,0,361,362,363,364,0,410,0,0,0,0,0,411,0,0,408,0,0,0,0,409,0,0,0,406,0,0,0,407,0,0,0,0,404,0,0,405,0,0,0,0,0,401,402,403,0,0,0,0,0,398,399,400,391,392,393,394,395,396,397,0,0,0,0,0,0,388,389,390,21,0,0,0,0,0,0,22,19,0,0,0,0,0,20,0,17,0,0,0,0,18,0,0,15,0,0,0,16,0,0,0,13,0,0,14,0,0,0,0,10,11,12,0,0,0,0,0,7,8,9,0,0,0,0,0,0,0,1,2,3,4,5,6,0,46,0,0,0,0,0,0,0,44,0,0,0,0,0,45,0,42,0,0,0,0,43,0,0,40,0,0,0,41,0,0,0,38,0,0,39,0,0,0,34,35,36,37,0,0,0,0,30,31,32,33,0,0,0,0,23,0,24,25,26,27,28,29,0,0,71,0,0,0,0,0,0,0,70,0,0,0,0,0,0,0,68,0,0,0,0,69,0,0,66,0,0,0,67,0,0,0,64,0,0,65,0,0,59,60,61,62,63,0,0,0,54,55,56,57,58,0,0,0,47,48,0,49,50,51,52,53,0,0,0,96,0,0,0,0,0,0,0,95,0,0,0,0,0,0,0,94,0,0,0,0,0,0,0,92,0,0,0,93,89,0,0,90,0,0,91,0,0,84,85,86,87,88,0,0,0,79,80,81,82,83,0,0,72,73,74,0,75,76,77,78,0,0,0,0,121,0,0,0,0,0,0,0,120,0,0,0,0,0,0,0,119,0,0,0,117,0,0,0,118,0,0,0,0,114,0,0,115,0,0,116,0,0,109,110,111,112,113,0,0,0,104,105,106,107,108,0,97,98,99,100,0,101,102,103,0,0,0,0,0,146,0,0,0,0,0,0,0,145,0,0,143,0,0,0,0,144,0,0,0,141,0,0,0,142,0,0,0,0,139,0,0,140,0,0,0,0,0,134,135,136,137,138,0,0,0,129,130,131,132,133,122,123,124,125,126,0,127,128,0,0,0,0,0,0,170,0,168,0,0,0,0,0,169,0,0,166,0,0,0,0,167,0,0,0,164,0,0,0,165,0,0,0,0,162,0,0,163,0,0,0,0,0,158,159,160,161,0,0,0,0,154,155,156,157,147,148,149,150,151,152,0,153,192,0,0,0,0,0,0,193,0,190,0,0,0,0,0,191,0,0,188,0,0,0,0,189,0,0,0,186,0,0,0,187,0,0,0,0,184,0,0,185,0,0,0,0,0,181,182,183,0,0,0,0,0,178,179,180,171,172,173,174,175,176,177];

    constructor (Hasher _poseidonContract, address _verifierContract, address _chessContract) {
        poseidonContract = _poseidonContract;
        verifierContract = _verifierContract;
        chessContract = _chessContract;
        //testing only
        //legalMoveIndicies = [0, 5, 1804];
    }

    function setLegalMoveIndicies(uint16[] calldata _legalMoves) public {
        require(msg.sender == chessContract);
        delete legalMoveIndicies;

        for (uint8 i = 0; i < _legalMoves.length; i++) {
            legalMoveIndicies.push(reverseMoveMap[_legalMoves[i]]);
        }

        nextLegalMoveIndex = -1;
        advanceNextLegalMoveIndex();
    }

    function hashInputs(uint256[INPUT_LEN] calldata inputs) public {
        uint256 _inputHash = poseidonContract.poseidon([inputs[0], inputs[1]]);

        for(uint i = 2; i < INPUT_LEN; i++) {
            _inputHash = poseidonContract.poseidon([_inputHash, inputs[i]]);
        }

        inputHash = _inputHash;
    }

    function hashOutputChunk(uint256[] calldata outputChunk, uint16 chunkStart, uint16 chunkEnd) public {
        require(chunkStart == lastChunkEndIndex, "Must start chunk where last chunk ended");
        require(chunkEnd <= OUTPUT_LEN, "cannot chunk past output length for leela nn");
        uint256 currHash = outputHash;
        uint16 init = 0;

        if (outputHash == 0) {
            currHash = poseidonContract.poseidon([outputChunk[0], outputChunk[1]]);
            init = 2;

            //init winningMoveValue
            winningMoveIndex = 0;
            winningMoveValue = -1_000_000_000_000;

            if (nextLegalMoveIndex == 0) {
                winningMoveValue = feltToInt(outputChunk[0]);
                advanceNextLegalMoveIndex();
            }
            if (nextLegalMoveIndex == 1) {
                int256 outputInt = feltToInt(outputChunk[1]);
                if (winningMoveValue < outputInt) {
                    winningMoveValue = outputInt;
                    winningMoveIndex = 1;
                }
                advanceNextLegalMoveIndex();
            }
        }

        for (uint16 i = init; i < chunkEnd - chunkStart; i++) {
            if (int16(i + chunkStart) == nextLegalMoveIndex) {
                advanceNextLegalMoveIndex();
                int256 outputInt = feltToInt(outputChunk[i]);
                if (outputInt > winningMoveValue) {
                    winningMoveIndex = i + chunkStart;
                    winningMoveValue = outputInt;
                }
            }
            currHash = poseidonContract.poseidon([currHash, outputChunk[i]]);
        }

        outputHash = currHash;
        lastChunkEndIndex = chunkEnd;
    }

    function resetOutputHashing() public {
        outputHash = 0;
        lastChunkEndIndex = 0;
        winningMoveIndex = 0;
        winningMoveValue = 0;
        nextLegalMoveIndex = -1;
        advanceNextLegalMoveIndex();
    }

    function advanceNextLegalMoveIndex() private {
        uint16 currHeighestIndex = 10000;
        for (uint i = 0; i < legalMoveIndicies.length; i++) {
            if (int16(legalMoveIndicies[i]) > nextLegalMoveIndex) {
                if (legalMoveIndicies[i] < currHeighestIndex) {
                    currHeighestIndex = legalMoveIndicies[i];
                }
            }
        }
        nextLegalMoveIndex = int16(currHeighestIndex);
    }

    function verify(bytes calldata proof, bytes calldata instances) public returns (uint16) {
        require(inputHash != 0, "inputs not ingested!");
        require(outputHash != 0, "outputs not ingested!");
        require(lastChunkEndIndex == OUTPUT_LEN, "outputs not ingested!");

        (bool success, ) = verifierContract.call(abi.encodePacked(instances, inputHash, outputHash, proof));
        require(success, "proof did not verify!");

        inputHash = 0;
        outputHash = 0;
        lastChunkEndIndex = 0;
        uint16 verifiedMove = moveMapArray[winningMoveIndex];
        winningMoveIndex = 0;
        winningMoveValue = 0;
        return verifiedMove;
    }

    function feltToInt(uint256 felt) private pure returns (int256) {
        if (felt > TWO_INV) {
            return (int256(felt) - MODULUS);
        } else {
            return int256(felt);
        }
    }

    function packInputs(uint256[][][] calldata inputs) public {

    }
}