import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';
import LoadingIndicator from '../LoadingIndicator';

/*
 * We pass in our characterNFT metadata so we can a cool card in our UI
 */
const Arena = ({ characterNFT , setCharacterNFT }) => {
  // State
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState('')
  const [showToast, setShowToast] = useState('');
  const toast_hide = showToast ? "show" : "hide";


  const runAttackAction = async () => {
    try {
      if (gameContract) {
        setAttackState('attacking');
        console.log('Attacking the frontman...');
        const txn = await gameContract.attackBoss();
        await txn.wait();
        console.log(txn);
        setAttackState('hit');
              
        /*
        * Set your toast state to true and then false 5 seconds later
        */
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
      setAttackState('');
    }
  };

  // UseEffects
  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      setGameContract(gameContract);
    } else {
      console.log('Ethereum object not found');
    }
  }, []);

  useEffect(() => {
    const fetchBoss = async () => {
        const bossTxn = await gameContract.getBigBoss();
        console.log('Boss:', bossTxn);
        setBoss(transformCharacterData(bossTxn));
    };

    /*
    * Setup logic when this event is fired off
    */
    const onAttackComplete = (newBossHp, newPlayerHp) => {
        const bossHp = newBossHp.toNumber();
        const playerHp = newPlayerHp.toNumber();

        console.log("AttackComplete: Boss Hp: " + bossHp +  "Player Hp: " + playerHp);

        /*
        * Update both player and boss Hp
        */
        setBoss((prevState) => {
            return { ...prevState, hp: bossHp };
        });

        setCharacterNFT((prevState) => {
            return { ...prevState, hp: playerHp };
        });
    };

    if (gameContract) {
        fetchBoss();
        gameContract.on(onAttackComplete);
    }

    /*
    * Make sure to clean up this event when this component is removed
    */
    return () => {
        if (gameContract) {
            gameContract.off( onAttackComplete);
        }
    }
}, [gameContract]);

  return (
    <div className="arena-container">
   
    {/* Toast Ui */}
    {boss && (
      <div id="toast" className={toast_hide}>
        <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
      </div>
    )}
    {/* Boss UI */}
    {boss && (
      <div className="boss-container">
        <div className={`boss-content ${attackState}`}>
          <h2>🔥 {boss.name} 🔥</h2>
          <div className="image-content">
            <img src= {`https://cloudflare-ipfs.com/ipfs/${boss.imageURI}`} alt={`Boss ${boss.name}`} />
            <div className="health-bar">
              <progress value={boss.hp} max={boss.maxHp} />
              <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
            </div>
          </div>
        </div>
        <div className="attack-container">
          <button className="cta-button" onClick={runAttackAction}>
            {`💥 Attack ${boss.name}`}
          </button>
        </div>

        {attackState === 'attacking' && (
        <div className="loading-indicator">
          <LoadingIndicator />
          <p>Attacking 🔪</p>
        </div>
      )}
      </div>
    )}

    {/* Character NFT */}
      {characterNFT && (
      <div className="players-container">
        <div className="player-container">
          <h2>Your Character</h2>
          <div className="player">
            <div className="image-content">
              <h2>{characterNFT.name}</h2>
              <img
                src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`}
                alt={`Character ${characterNFT.name}`}
              />
              <div className="health-bar">
                <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
              </div>
            </div>
            <div className="stats">
              <h4>{`🐙  Attack Damage: ${characterNFT.attackDamage}`}</h4>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default Arena;