import Image from 'next/image';
import { ArcadeHeader } from '../pageElements/arcadeGame/ArcadeHeader';
import { NextMoveLeaderboard } from '../pageElements/arcadeGame/NextMoveLeaderboard';
import { NextMoveTimer } from '../pageElements/arcadeGame/NextMoveTimer';
import { PrizePool } from '../pageElements/arcadeGame/PrizePool';
import { ChessBoard } from '../pageElements/arcadeGame/ChessBoard/ChessBoard';
import { VotingPanel } from '../pageElements/arcadeGame/votingPanel/VotingPanel';
import { useArcadeMachineContext } from '../contexts/ArcadeMachineContext';
import { GameDetails } from '../pageElements/gamePopups/GameDetails';
import { GameInstructions } from '../pageElements/gamePopups/GameInstructions';
import { ArcadeControls } from '../pageElements/arcadeGame/ArcadeControls';
import { CreatedByModulousLabs } from '../pageElements/arcadeGame/CreatedByModulousLabs';
import { useMediaQueryContext } from '../contexts/MediaQueryContext';
import { ScreenTooSmall } from '../pageElements/ScreenTooSmall';

export default function Home() {
  const { isDesktop } = useMediaQueryContext();
  const { showGameInstructions, showGameDetails } = useArcadeMachineContext();

  if (isDesktop) {
    return <ScreenTooSmall />;
  }

  return (
    <div className="flex h-screen w-screen flex-col items-end justify-end bg-off-black">
      <div className="relative mx-auto h-[875px] w-[1250px]">
        <Image
          priority
          fill
          src="/ArcadeMachine.svg"
          alt="arcade-machine"
          className="z-0 object-contain"
        />

        <div className="absolute top-0 left-0 right-0 bottom-0">
          <ArcadeHeader />
          <CreatedByModulousLabs />
          <ArcadeControls />
          <div className="relative mx-[16.5rem] mt-10  h-[410px]">
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
            <div className="relative grid grid-cols-2 gap-x-2 px-7 pt-2">
              <div className="col-span-1">
                <div className="h-20">
                  <NextMoveTimer />
                </div>
                <ChessBoard />
              </div>
              <div className="col-span-1">
                <div className="h-20">
                  <PrizePool />
                </div>
                <NextMoveLeaderboard />
                <VotingPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
