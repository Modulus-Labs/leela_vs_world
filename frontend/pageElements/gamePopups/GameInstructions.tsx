import Modal from "react-modal";
import { useArcadeMachineContext } from "../../contexts/ArcadeMachineContext";
import { BasicModal } from "../../components/modals/BasicModal";
import { OutlineButton } from "../../components/buttons/OutlineButton";

// --- To display messages to user ---
export const GameInstructions = () => {
  const { showGameInstructions, setShowGameInstructions } =
    useArcadeMachineContext();

  return (
    <BasicModal>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* --- TODO(ryancao): Change the link --- */}
        <span style={{ fontSize: 15, marginBottom: 20 }}>
          {'"Leela vs the World" is a game of chess '}
          <a
            href={"https://medium.com/@ModulusLabs"}
            style={{ textDecorationLine: "underline" }}
            target={"_blank"}
          >
            {"(narrative)"}
          </a>
          {
            " — a simple global board where an experiment unlike any before is playing out right before our eyes."
          }
        </span>

        <span
          style={{
            fontSize: 15,
            fontWeight: "bolder",
            textDecorationLine: "underline",
          }}
        >
          {'On one side: "Leela"'}
        </span>
        <span style={{ marginBottom: 20, fontSize: 15 }}>
          {
            "She's a highly skilled reinforcement learning chess engine based on the popular "
          }
          <a
            href={"https://en.wikipedia.org/wiki/Leela_Chess_Zero"}
            target={"_blank"}
            style={{ textDecorationLine: "underline" }}
          >
            {"Lc0"}
          </a>
          {
            ". Her moves are also verified at each step using zero-knowledge proofs, so you know "
          }
          {/* --- TODO(ryancao): Link to the verifier contract --- */}
          <a
            href={""}
            target={"_blank"}
            style={{ textDecorationLine: "underline" }}
          >
            {"it's always her"}
          </a>
          {"."}
        </span>

        <span
          style={{
            fontSize: 15,
            fontWeight: "bolder",
            textDecorationLine: "underline",
          }}
        >
          {'On the other side: "The World"'}
        </span>
        <span style={{ marginBottom: 20, fontSize: 15 }}>
          {
            "That's us. Each turn, we have 1 hour to stake money behind possible moves. At the end of the timer, one will be chosen randomly weighted by the amount of $ behind the nominated moves."
          }
        </span>

        <span style={{ fontSize: 15, marginBottom: 20 }}>
          {
            'Here\'s the twist: to submit your vote, you must bet that either "Leela" or "The World" wins the game!'
          }
          <br />
          {
            "If you're correct, you'll get your initial stake back, along with a proportional cut of the other side's staked pool."
          }
        </span>

        <span style={{ fontSize: 15, marginBottom: 20 }}>
          {"In other words:"}
          <br />
          {
            '- If you bet on "The World:" you\'d vote each round for the strongest possible move for the human team, and'
          }
          <br />
          {
            '- If you bet on "Leela:" you\'d vote for bad moves that jeopardize our chance at victory.'
          }
        </span>

        <span style={{ fontSize: 15, marginBottom: 20 }}>
          {
            "That's right, it's the age old question of whether collective wisdom or self-interested infighting wins the day... shall we find out?"
          }
        </span>

        <OutlineButton
          text="Let's do it!!!"
          onClick={() => {
            setShowGameInstructions(false);
          }}
          className="mx-auto"
        />
      </div>
    </BasicModal>
  );
};
