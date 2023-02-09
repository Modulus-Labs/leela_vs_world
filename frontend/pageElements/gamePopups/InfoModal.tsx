import Modal from 'react-modal';
import { useArcadeMachineContext } from '../../contexts/ArcadeMachineContext';

// --- To display messages to user ---
export const InfoModal = () => {

  const {
    showInfoModal,
    setShowInfoModal,
    infoModalDismissVisible,
    infoModalText,
  } = useArcadeMachineContext();

  return (
    <div>
      <Modal
        ariaHideApp={false}
        isOpen={showInfoModal}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: "50%",
          },
        }}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "center", flexDirection: "column" }}>
          <span style={{ fontSize: 15, marginBottom: 10 }}>{infoModalText}</span>
          {
            infoModalDismissVisible ?
              <button
                style={{ backgroundColor: "transparent", borderRadius: 10, borderColor: "black", padding: 5, fontSize: 15, borderWidth: 1 }}
                onClick={() => { setShowInfoModal(false) }}>{"Okay"}</button>
              :
              <></>
          }
        </div>
      </Modal>
    </div>
  );
}