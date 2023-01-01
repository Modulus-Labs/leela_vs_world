pragma solidity >=0.7.6;

// enum of size < 256 uses uint8 for index
enum Side {
	World, // index 0
	Leela // index 1
}

// struct Bet {
// 	uint256 amount;
// 	Side side;
// }

struct MoveHistory {
	uint8 piece; // move piece
	// 16-bit var, high word = from pos, low word = to pos
	// move can also be: resign, request draw, accept draw.
	uint16 move;
}

// 64 squares of the chess board + 3 special options
// enum MoveOption {
// 	// 0, 1, 2
// 	Resign, RequestDraw, AcceptDraw,
// 	// 3, 4, 5, 6, 7, 8, 9, 10
// 	A1, B1, C1, D1, E1, F1, G1, H1,
// 	// 11, 12, 13, 14, 15, 16, 17, 18
// 	A2, B2, C2, D2, E2, F2, G2, H2,
// 	// 19, 20, 21, 22, 23, 24, 25, 26
// 	A3, B3, C3, D3, E3, F3, G3, H3,
// 	// 27, 28, 29, 30, 31, 32, 33, 34
// 	A4, B4, C4, D4, E4, F4, G4, H4,
// 	// 35, 36, 37, 38, 39, 40, 41, 42
// 	A5, B5, C5, D5, E5, F5, G5, H5,
// 	// 43, 44, 45, 46, 47, 48, 49, 50
// 	A6, B6, C6, D6, E6, F6, G6, H6,
// 	// 51, 52, 53, 54, 55, 56, 57, 58
// 	A7, B7, C7, D7, E7, F7, G7, H7,
// 	// 59, 60, 61, 62, 63, 64, 65, 66
// 	A8, B8, C8, D8, E8, F8, G8, H8
// }