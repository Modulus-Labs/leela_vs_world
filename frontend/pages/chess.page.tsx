import Image from "next/image";
import { ArcadeHeader } from "../pageElements/arcadeGame/ArcadeHeader";
import { NextMoveLeaderboard } from "../pageElements/arcadeGame/NextMoveLeaderboard";
import { NextMoveTimer } from "../pageElements/arcadeGame/NextMoveTimer";
import { PrizePool } from "../pageElements/arcadeGame/PrizePool";
import { ChessBoard } from "../pageElements/arcadeGame/ChessBoard/ChessBoard";
import { VotingPanel } from "../pageElements/arcadeGame/votingPanel/VotingPanel";
import { useArcadeMachineContext } from "../contexts/ArcadeMachineContext";
import { GameInstructions } from "../pageElements/gamePopups/GameInstructions";
import { useMediaQueryContext } from "../contexts/MediaQueryContext";
import { ScreenTooSmall } from "../pageElements/ScreenTooSmall";
import { FadingPageWrapper } from "../components/pageWrappers/FadingPageWrapper";
import { GameDetails } from "../pageElements/gamePopups/BuyPowerModal";
import { InfoModal } from "../pageElements/gamePopups/InfoModal";
import { useChessGameContext } from "../contexts/ChessGameContext";
import { ArcadeFooter } from "../pageElements/arcadeGame/ArcadeFooter";
import Sound from "react-sound";
import { DisclosureModal } from "../pageElements/gamePopups/DisclosureModal";
import { useBettingContext } from "../contexts/BettingContext";
import { EndGameModal } from "../pageElements/gamePopups/EndGameModal";
import { AnimatePresence } from "framer-motion";

export default function ChessPage() {
  const { isMobile } = useMediaQueryContext();
  const {
    showGameInstructions,
    showGameDetails,
    showInfoModal,
    leelaSongPlaying,
    showDisclosureModal,
  } = useArcadeMachineContext();
  const { currChessBoard } = useChessGameContext();
  const { showEndGameModal } = useBettingContext();

  if (isMobile) {
    return <ScreenTooSmall />;
  }

  return (
    <FadingPageWrapper>
      <div className="flex h-full w-full cursor-pointer flex-row items-center justify-center bg-off-black">
        <svg className="h-full w-full object-cover" viewBox="0 0 1920 1080">
          <foreignObject
            width="1920"
            height="1080"
            alignmentBaseline="baseline"
          >
            <Image
              priority
              fill
              src="/ArcadeMachine.gif"
              alt="arcade-machine"
              className="pointer-events-none z-10 object-contain"
            />
            <div className="z-0 -ml-[25px]">
              <div className="mx-auto mt-0 h-[230px] w-[1375px]">
                <ArcadeHeader />
              </div>

              <div className="relative mx-auto mt-[65px] grid h-[590px] w-[1025px] grid-cols-2 gap-x-[50px] px-[30px] py-[30px]">
                {/* Popups */}
                {showGameDetails && (
                  <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-center bg-black bg-opacity-70">
                    <GameDetails />
                  </div>
                )}
                {showGameInstructions && (
                  <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-center bg-black bg-opacity-70">
                    <GameInstructions />
                  </div>
                )}
                {showInfoModal && (
                  <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-center bg-black bg-opacity-70">
                    <InfoModal />
                  </div>
                )}
                {showDisclosureModal && <DisclosureModal />}
                {showEndGameModal && <EndGameModal />}

                <div className="col-span-1 flex flex-col justify-between">
                  <div className="h-[96px]">
                    <NextMoveTimer />
                  </div>
                  <div className="h-[425px] w-[425px] self-end">
                    <ChessBoard />
                  </div>
                </div>
                <div className="col-span-1 flex flex-col justify-between">
                  <div className="flex h-[91px]">
                    <PrizePool />
                  </div>
                  {currChessBoard.chessGame.turn() === "w" ? (
                    <>
                      <div className="flex h-[193px]">
                        <NextMoveLeaderboard />
                      </div>
                      <div className="flex h-[216px]">
                        <VotingPanel />
                      </div>
                    </>
                  ) : (
                    <>
                      <Image
                        height={700}
                        width={700}
                        src="/leelaThinking.gif"
                        alt="Leela-thinking-gif"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </foreignObject>
        </svg>
      </div>
      <Sound
        url="/Leela_Song_Take_3.m4a"
        playStatus={leelaSongPlaying ? "PLAYING" : "PAUSED"}
      />
    </FadingPageWrapper>
  );
}
