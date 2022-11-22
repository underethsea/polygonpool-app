import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";

import Modal from "react-modal";
import "./modal.css";
import { Timer } from "./timer";
import CountUp from "react-countup";

import { GetSubgraphData } from "./graphData";
import { ethers } from "ethers";
import {
  chain,
  useAccount,
  useConnect,
  useContract,
  // useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useNetwork,
  useWaitForTransaction,
  useSigner,
} from "wagmi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  Separator, EstimatePrize, ChainObject,
  TimeAgo, NumberChop, DecimalsForCount
} from "./utils"

import { CONTRACT } from "./contractConnect.jsx";
import { ADDRESS } from "./address.jsx";
import { ABI } from "./abi.jsx";

// hardcoded for now | in utils
// const TOKENYield = 0.05;

const BNZERO = ethers.BigNumber.from("0")
const BNONEWEI = ethers.BigNumber.from("1")
const NumberOfPrizes = 30;

const ethValue = (amount) => {
  return ethers.utils.formatUnits(amount, 18);
};


function Dapp() {
 
  // get users balances
  async function getBalance(address) {
    try {
      // console.log(ChainObject(chain), "fetching balances");
   
      let [
        TOKENBalance,
        TICKETBalance,
        SPONSORSHIPBalance,
      ] = await Promise.all([
        CONTRACT[ChainObject(chain)].TOKEN.balanceOf(address),
        CONTRACT[ChainObject(chain)].TICKET.balanceOf(address),
        CONTRACT[ChainObject(chain)].SPONSORSHIP.balanceOf(address),
        
      ]);

      let balances = {
        TOKEN: TOKENBalance,
        TICKET: TICKETBalance,
        SPONSORSHIP: SPONSORSHIPBalance,
      };

      // console.log("balances fetched ", balances);
      let balanceArray = [balances];
      return balanceArray;
    } catch (error) {
      console.log("error fetching balances", error);
      return [{ TOKEN: BNZERO, TICKET: BNZERO, SPONSORSHIP: BNZERO }];
    }
  }
  async function getAwardStatus() {
    let [canStartAward,canCompleteAward] =  await Promise.all([
      CONTRACT[ChainObject(chain)].PRIZESTRATEGY.canStartAward(),
      CONTRACT[ChainObject(chain)].PRIZESTRATEGY.canCompleteAward(),
    ])
    console.log("award status",canStartAward,canCompleteAward)
    setAwardStatus({canStart:canStartAward,canComplete:canCompleteAward})
  }
  async function getPoolStats() {
    console.log(ChainObject(chain), "getting pool stats");
    let [
      prizePoolBalance,
      SPONSORSHIPTotalSupply,
      TICKETTotalSupply,
      prizePeriodRemainingSeconds,
      numberOfWinners
    ] = await Promise.all([
      CONTRACT[ChainObject(chain)].TOKEN.balanceOf(
        ADDRESS[ChainObject(chain)].PRIZEPOOL
      ),
      CONTRACT[ChainObject(chain)].SPONSORSHIP.totalSupply(),
      CONTRACT[ChainObject(chain)].TICKET.totalSupply(),
      CONTRACT[ChainObject(chain)].PRIZESTRATEGY.prizePeriodRemainingSeconds(),
      CONTRACT[ChainObject(chain)].PRIZESTRATEGY.numberOfWinners()
    ]);

    let poolStats = {
      prizepool: ethValue(prizePoolBalance),
      TICKETTotalSupply: ethValue(TICKETTotalSupply),
      SPONSORSHIPTotalSupply: ethValue(SPONSORSHIPTotalSupply),
      remainingSeconds: parseInt(prizePeriodRemainingSeconds),
      numberOfWinners: parseInt(numberOfWinners)
    };
    console.log("stats", poolStats);
    return poolStats;
  }

  const {
    connector: activeConnector,
    address,
    isConnecting,
    isDisconnected,
    isConnected,
  } = useAccount({
    onConnect({ address, connector, isReconnected }) {
      console.log("Connected", { address, connector, isReconnected });
    },
  });

  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const signer = useSigner();

  const [withdrawButton,setWithdrawButton] = useState("WITHDRAW")
  const [balances, setBalances] = useState([
    { TOKEN: BNZERO, TICKET: BNZERO, SPONSORSHIP: BNZERO },
  ]);
  const [poolInfo, setPoolInfo] = useState({});
  const [prizeMap, setPrizeMap] = useState([]);
  const [awardStatus, setAwardStatus] = useState({})
  const [sponsorMap, setSponsorMap] = useState([]);
  const [prizeGross,setPrizeGross] = useState(0)
  const [addressValue, setAddressValue] = useState("");
  const [popup, setPopup] = useState(Boolean);
  const [graphInfo, setGraphInfo] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFocus, setModalFocus] = useState("claim");
  const [allowances, setAllowances] = useState({});

  const [inputAmount, setInputAmount] = useState("");
  const [validAddress, setValidAddress] = useState(true);
  const [prizePoolAddress, setPrizePoolAddress] = useState(
    "0x79Bc8bD53244bC8a9C8c27509a2d573650A83373"
  );
  const [TOKENAddress, setTOKENAddress] = useState(
    "0x79Bc8bD53244bC8a9C8c27509a2d573650A83373"
  );
  const [updateWallet, setUpdateWallet] = useState(0);
  const [walletMessage, setWalletMessage] = useState(""); // lousy bug-fix for setPoolerToWallet not getting poolerAddress useEffect to trigger
  const amountInput = useCallback((inputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);
  // const {refresh, setRefresh} = useState(0)

  const { chain, chains } = useNetwork();

  async function openWallet() {
    setModalFocus("wallet");
    setIsModalOpen(true);
    setInputAmount("");
  }
  async function openWalletWithdraw() {
    setModalFocus("withdrawWallet");
    setIsModalOpen(true);
    setInputAmount("");
  }

  async function openAward() {
    await getAwardStatus();
    setModalFocus("award");
    setIsModalOpen(true);
  }
 
  async function openModal() {
    setIsModalOpen(true);
  }
  async function closeModal() {
    setIsModalOpen(false);
  }
  // console.log("rendered")
  // console.log(graphInfo?.data?.controlledTokenBalances)
  // console.log(prizeDistributor)
  // console.log(balances);
  // console.log("TICKETbalance", balances[0].TICKET);
  // console.log("chain", chain);
  // console.log("isconnected", isConnected);
  // console.log(address)
  // console.log(allowances);
  // console.log(chain)

  const isInvalidInputAmt = (amt) => {
    const inputAmt = Number(amt);
    return Number.isNaN(inputAmt) || inputAmt <= 0;
  };


  // function isValidAddress(addressToVerify) {
  //   try {
  //     if (ethers.utils.isAddress(addressToVerify)) {
  //       // console.log("valid address: ",addressToVerify)
  //       setValidAddress(true);
  //       return true;
  //     } else {
  //       console.log("invalid address: ", addressToVerify);
  //       setValidAddress(false);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.log("invalid address catch: ", addressToVerify);
  //     setValidAddress(false);
  //     return false;
  //   }
  // }

  const amountFormatForSend = (amt) => {
    if (Number(amt) != amt) {
      return "0";
    } else {
      if (parseFloat(amt) > 0) {
        // console.log(
        //   "amount formatted",
        //   ethers.utils.parseUnits(amt.toString(), 18).toString()
        // );
        return ethers.utils.parseUnits(amt, 18);
        // return ethers.BigNumber.from(ethers.utils.parse)
      } else {
        return "0";
      }
    }
  };
async function getStats() {
  let data = await GetSubgraphData("POLYGON")
  console.log(data)
  setPrizeGross(data.data.prizePools[0].cumulativePrizeGross)
  setGraphInfo(data)
  setModalFocus("stats")
  setIsModalOpen(true);

}
  async function getWinners() {
    console.log("getting winners");
    let data = await GetSubgraphData("POLYGON");
    setGraphInfo(data);
    console.log("got graph info", data);
    let drawId = data.data.prizePools[0].currentPrizeId
    let awardedTimestamp = data.data.prizePools[0].prizes[0].awardedTimestamp
    let winnerMap = data.data.prizePools[0].prizes
    winnerMap = winnerMap[0].awardedControlledTokens
    let winnerData = {
      timestamp: awardedTimestamp,
      drawId: drawId,
      winnerMap: winnerMap
    }
    console.log(winnerData)
    setPrizeMap(winnerData);
    setModalFocus("winners");
    setIsModalOpen(true);
  }

  async function getPlayers() {
    // console.log("getting sponsors");
    let data = await GetSubgraphData("ETHEREUM");
    setGraphInfo(data);
    console.log("got graph info", data);
    let sponsorMap = data.data.controlledTokenBalances
    console.log(sponsorMap)
    setSponsorMap(sponsorMap);
    setModalFocus("players");
    setIsModalOpen(true);
  }

  async function calculateExitFee(exitFeeAddress, exitFeeDeposit) {
    // console.log(
    //   "exit feee calc fetch",
    //   exitFeeAddress,
    //   ADDRESS[ChainObject(chain)].TICKET,
    //   exitFeeDeposit
    // );
    let exitFee = await CONTRACT[
      ChainObject(chain)
    ].PRIZEPOOL.callStatic.calculateEarlyExitFee(
      exitFeeAddress,
      ADDRESS[ChainObject(chain)].TICKET,
      exitFeeDeposit
    );
    // console.log("exitfee", exitFee[1].toString()) // index 0 is burned credit - 1 is exit fee
    // exitFee = parseInt(exitFee[1]) * 1.05
    // return exitFee.toString();
    console.log("fee", exitFee.exitFee.toString());
    return exitFee.exitFee.toString();
  }

  // calculateExitFee(address, amountFormatForSend(inputAmount))

  // ------ WITHDRAW TRANSACTION CONFIG -------- //  

  const { config: withdrawConfig, error: withdrawConfigError } =
    usePrepareContractWrite({
      args: [
        address,
        amountFormatForSend(inputAmount),
        ADDRESS[ChainObject(chain)].TICKET,
        amountFormatForSend(inputAmount),
      ],
      addressOrName: ADDRESS[ChainObject(chain)].PRIZEPOOL,
      contractInterface: ABI.PRIZEPOOL,
      functionName: "withdrawInstantlyFrom",
      // overrides: {
      //   gasLimit: 625000,
      // },
    });
  
      // ------ START AWARD TRANSACTION CONFIG -------- //  
      const {
        config: startAwardConfig,
        error: startAwardConfigError,
        isError: isStartAwardConfigError,
      } = usePrepareContractWrite({
        
        addressOrName: ADDRESS[ChainObject(chain)].PRIZESTRATEGY,
        contractInterface: ABI.PRIZESTRATEGY,
        functionName: "startAward",
      });

  // ------ DEPOSIT TRANSACTION CONFIG -------- //  
  const {
    config: depositConfig,
    error: depositConfigError,
    isError: isDepositConfigError,
  } = usePrepareContractWrite({
    args: [
      address,
      amountFormatForSend(inputAmount),
      ADDRESS[ChainObject(chain)].TICKET,
      "0x0000000000000000000000000000000000000000",
    ],
    addressOrName: ADDRESS[ChainObject(chain)].PRIZEPOOL,
    contractInterface: ABI.PRIZEPOOL,
    functionName: "depositTo",
    // overrides: {
    //   gasLimit: 625000,
    // },
  });

  // ------ APPROVE TRANSACTION CONFIG -------- //
  const {
    config: TOKENConfig,
    error: TOKENConfigError,
    isError: TOKENConfigIsError,
  } = usePrepareContractWrite({
    args: [
      ADDRESS[ChainObject(chain)].PRIZEPOOL,
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ],
    addressOrName: ADDRESS[ChainObject(chain)].TOKEN,
    contractInterface: ABI.ERC20,
    functionName: "approve",
  });

  const {
    write: approveWrite,
    isSuccess: approveSuccess,
    status: approveStatus,
    error: approveError,
    isLoading: approveLoading,
    data: approveData,
    isIdle: approveIdle,
    isError: isApproveError,
  } = useContractWrite(TOKENConfig);

  const {
    write: depositWrite,
    error: depositError,
    isError: isDepositError,
    isIdle: depositIdle,
    data: depositData,
    isSuccess: depositSuccess,
    isLoading: depositLoading,
  } = useContractWrite(depositConfig);

  const {
    write: withdrawWrite,
    error: withdrawError,
    isError: isWithdrawError,
    isIdle: withdrawIdle,
    data: withdrawData,
    isSuccess: withdrawSuccess,
    isLoading: withdrawLoading,
  } = useContractWrite(withdrawConfig);

  const {
    write: startAwardWrite,
    error: startAwardError,
    isError: isStartAwardError,
    isIdle: startAwardIdle,
    data: startAwardData,
    isSuccess: startAwardSuccess,
    isLoading: startAwardLoading,
  } = useContractWrite(startAwardConfig);

  const { isFetching: approveFetching, isLoading: approveWaitLoading, isSuccess: approveWaitSuccess } =
    useWaitForTransaction({
      hash: approveData?.hash,
      onSuccess(data) {
        toast("Approve success!", {
          position: toast.POSITION.BOTTOM_RIGHT,
        });
        console.log("Approve success waiting over", data);
      },
    });

  const {
    isFetching: withdrawFetching,
    isLoading: withdrawWaitLoading,
    isSuccess: withdrawWaitSuccess,
  } = useWaitForTransaction({
    hash: withdrawData?.hash,
    onSuccess(data) {
      toast("Withdraw success!", {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
      closeModal();
      console.log("Withdraw success waiting over", data);
    },
  });

  const {
    isFetching: depositFetching,
    isError: depositWaitError,
    isLoading: depositWaitLoading,
    isSuccess: depositWaitSuccess,
  } = useWaitForTransaction({
    hash: depositData?.hash,
    onSuccess(data) {
      closeModal();
      toast("Deposit success!", {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
      console.log("Deposit success waiting over", data);
    },
    onError(error) {
      toast("Deposit error", {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
      console.log("Deposit error", error);
    },
  });

  function GetTOKENNow() {
    if (balances[0] !== undefined) {
      if (
        isConnected &&
        balances[0].TOKEN === BNZERO &&
        balances[0].TICKET === BNZERO
      ) {
        return (
          <div>
            <span className="get-token">WANNA WIN? GET POOL <a href="https://app.uniswap.org">
              <span title="Uniswap"><img src="images/uniswap.png" className="token-icon"/></span></a>
              </span>
          </div>
        );
      } else {
        return null;
      }
    }
  }

  function DepositButton() {
    if (balances[0] !== undefined) {
      // console.log(balances);
      return (
        isConnected && (
          <span>
            {balances[0].TOKEN.gt(BNZERO) && (
              <span>
                <span
                  className="open-wallet"
                  onClick={() => {
                    openWallet();
                  }}
                >
                  &nbsp;
                  <span className="actionButton display-not-block">
                    DEPOSIT NOW
                  </span>
                  &nbsp;
                </span>
              </span>
            )}
          </span>
        )
      );
    } else {
      return null;
    }
  }

  function WithdrawButton() {
    if (balances[0] !== undefined) {
      return (
        isConnected && (
          <span>
            {balances[0].TICKET.gt(BNZERO)  && (
              <span
                className="open-wallet"
                onClick={() => {
                  openWalletWithdraw();
                }}
              >
                &nbsp;
                <span className="actionButton display-not-block">WITHDRAW</span>
                &nbsp;
              </span>
            )}
          </span>
        )
      );
    } else {
      return null;
    }
  }
  // function AwardButton() {
  //   if (isNaN(parseInt(graphInfo?.data?.prizePools[0].currentPrizeId))) {
  //     return (

  //         <span className="open-wallet" onClick={() => { openAward(); }}>&nbsp;
  //           <span className="actionButton display-not-block">AWARD PRIZE</span>&nbsp;

  //     </span>
  //     )
  //   } else { return null }
  // }

  const approve = () => {
    try {
      approveWrite();
      toast("Approving!", {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
    } catch (error) {
      setWalletMessage("error, see console");
      console.log(error);
    }
  };
const startAward = async () => {
  try{
    startAwardWrite()
    toast("Starting Award Process", {
      position: toast.POSITION.BOTTOM_RIGHT,
    });
  } catch (error) {
    setWalletMessage("error, see console");
    console.log(error);
  }

  }


const completeAward = async () => {

}
  const depositTo = async () => {
    console.log("input amt ",inputAmount)
    console.log("deposit amounts balance",balances[0].TOKEN," ",balances[0].TOKEN.toString()," ",ethers.utils.parseUnits(inputAmount,18))
    try {
      if (balances[0].TOKEN.lt(ethers.BigNumber.from(ethers.utils.parseUnits(inputAmount,18)))) {
        setWalletMessage("insufficient balance");
      }
      // else if (parseFloat(inputAmount) < 2) { setWalletMessage("2 usdc minimum") }
      else if (
        ethers.BigNumber.from(ethers.utils.parseUnits(inputAmount,18)).lt(BNONEWEI) 
      ) {
        setWalletMessage("amount invalid");
      } else {
        const rngStatus = await CONTRACT[
          ChainObject(chain)
        ].PRIZESTRATEGY.isRngRequested();
        if (!rngStatus) {
          setUpdateWallet(updateWallet + 1);
          try {
            depositWrite();
            toast("Depositing!", {
              position: toast.POSITION.BOTTOM_RIGHT,
            });
          } catch (error) {
            console.log(error);
          }
        } else {
          setWalletMessage("prize is being awarded");
          console.log("prize in progress");
        }

        // console.log(depositError)
      }
    } catch (error) {
      setWalletMessage("error, see console");
      console.log(error);
    }
  };

  const withdrawFrom = async () => {
    let okToWithdraw = false
    if(withdrawButton === "OK WITHDRAW WITH FEE") {okToWithdraw = true}
    try {
      let withdrawBalance = 0;
      console.log("withdraw balance", balances[0].TICKET);
      if (balances[0].TICKET === undefined) {
      } else {
        // console.log("withdraw set to ", withdrawBalance);
      }
      if (balances[0].TICKET.lt(ethers.BigNumber.from(ethers.utils.parseUnits(inputAmount,18)))) {
        setWalletMessage("insufficient balance");
      } else if (
        ethers.BigNumber.from(ethers.utils.parseUnits(inputAmount,18)).lt(BNONEWEI) 
      ) {
        setWalletMessage("amount invalid");
      } else {
        const rngStatus = await CONTRACT[
          ChainObject(chain)
        ].PRIZESTRATEGY.isRngRequested();
        if (!rngStatus) {
          let exitFee = await calculateExitFee(address,
            amountFormatForSend(inputAmount))
            exitFee = exitFee / 1e18
          if(exitFee > 0 && okToWithdraw === false) {setWalletMessage("FEE " + NumberChop(exitFee) + " POOL");setWithdrawButton("OK WITHDRAW WITH FEE")}
          else{withdrawWrite();setWithdrawButton("WITHDRAW")}
        } else {
          setWalletMessage("prize is being awarded");
          console.log("prize is being awarded");
        }
      }
    } catch (error) {
      setWalletMessage("error, see console");
      console.log(error);
    }
  };

  // const handleChange = (selectedOption) => {
  //   setAddressValue(selectedOption.target.value);
  //   try {
  //     if (isValidAddress(selectedOption.target.value)) {
  //       // console.log(`Address input: `, selectedOption);}
  //     } else {
  //     }
  //   } catch (error) {
  //     console.log("invalid address ");
  //   }
  // };

  useEffect(() => {
    const getApprovals = async () => {
      if (modalFocus === "wallet" && address) {
        console.log("fetching approvals");
        let [TOKENApproval] = await Promise.all([
          CONTRACT[ChainObject(chain)].TOKEN.allowance(
            address,
            ADDRESS[ChainObject(chain)].PRIZEPOOL
          ),
        ]);
        setAllowances({
          TOKEN: TOKENApproval,
        });
      }
    };
    getApprovals();
  }, [modalFocus, approveWaitSuccess, depositWaitSuccess, withdrawWaitSuccess]);

  useEffect(() => {
    const loadPage = async () => {
      let poolStats = await getPoolStats();
      setPoolInfo(poolStats);

      // removed subgraph for now
      // let data = await GetSubgraphData("ETHEREUM");
      // setGraphInfo(data);
    };
    loadPage();
  }, [chain]);

  useEffect(() => {
    const goGetPlayer = async () => {
      if (isConnected) {
        setPopup(true);
        // const currentTimestamp = parseInt(Date.now() / 1000);
        console.log("getting player ", address);
        let poolerBalances = await getBalance(address);

        setBalances(poolerBalances);
        setPopup(false);
      }
    };
    if (isConnected) {
      goGetPlayer();
    }
  }, [
    address,
    chain,
    isConnected,
    updateWallet,
    approveWaitSuccess,
    depositWaitSuccess,
    withdrawWaitSuccess,
  ]);

  return (
    <div className="dapp">
      <div>
        {" "}
        <br></br>
        {
          <div className="card-content">
            <center><div className="padding-top">
              {/* <div className="table-wrapper has-mobile-cards tablemax"> */}
                <table className="middle-table top-table">
                  
                    <tr>
                      <td>
                        <center><div className="padding-top">
                          <div class="top-title-text">WEEKLY WINNING</div>
                          <span className="top-title">


                                                    <img src="images/trophypool.png" className="trophy"></img>&nbsp;

                            
                            {!isNaN(poolInfo.prizepool) && (
                                poolInfo.prizepool -
                                  poolInfo.TICKETTotalSupply -
                                  poolInfo.SPONSORSHIPTotalSupply) === 0 ?
                                  <span><small>No prize currently</small></span> : <span>                         
                                  {/* <img src="/images/pooltoken.png" className="eth-title"></img> */}
                              {!isNaN(poolInfo.prizepool) && NumberChop(
                                poolInfo.prizepool -
                                  poolInfo.TICKETTotalSupply -
                                  poolInfo.SPONSORSHIPTotalSupply
                              )}</span>}
                            {/* {!isNaN(poolInfo.prizepool) && <CountUp start={0}
                            end={NumberChop(
                              poolInfo.prizepool -
                                poolInfo.TICKETTotalSupply -
                                poolInfo.SPONSORSHIPTotalSupply +
                                EstimatePrize(
                                  poolInfo.prizepool,
                                  poolInfo.remainingSeconds
                                )
                            )}
                            delay = {3}
                            decimal="."
                            decimals={DecimalsForCount(poolInfo.prizepool - poolInfo.TICKETTotalSupply - poolInfo.SPONSORSHIPTotalSupply + EstimatePrize(poolInfo.prizepool,poolInfo.remainingSeconds))} 
                            >{({ countUpRef, start }) => (
                              <span>
                                <span ref={countUpRef} />
                                </span>
                            )}
                          </CountUp>} */}
                            {/* <CountUp
                                        start={poolInfo.prizepool - poolInfo.TICKETTotalSupply - poolInfo.SPONSORSHIPTotalSupply + EstimatePrize(poolInfo.prizepool,poolInfo.remainingSeconds)}
                                        end={0.00012057} duration={86400} Separator=" "
                                        decimals={DecimalsForCount(poolInfo.prizepool - poolInfo.TICKETTotalSupply - poolInfo.SPONSORSHIPTotalSupply + EstimatePrize(poolInfo.prizepool,poolInfo.remainingSeconds))} 
                                        delay = {0} decimal="."
                                        // prefix="EUR "
                                        // suffix=" left"
                                        onEnd={() => console.log('Ended! 👏')}
                                        // onStart={() => console.log('Started! 💨')}
                                      > 
                                        {({ countUpRef, start }) => (
                                          <span>
                                            <span ref={countUpRef} />
                                            </span>
                                        )}
                                      </CountUp> */}
                          </span></div>
                         
                          <div className="padding-bottom">
                          {/* <span class="timer-text">WEEKLY WINNING</span>  */}
                          {!isNaN(poolInfo?.remainingSeconds) &&
                            <Timer seconds={Date.now() + (poolInfo?.remainingSeconds * 1000)} />

                            // <Timer seconds={Date.now() + poolInfo?.remainingSeconds * 1000} />
                                           
                          }
                          {!isNaN(poolInfo?.remainingSeconds) && parseInt(poolInfo?.remainingSeconds) === 0 && 
                              <span
                              className="open-wallet"
                              onClick={() => {
                                openAward();
                              }}
                            ><span className="actionButton display-not-block">AWARD PRIZES</span></span>}

                          </div>
                        </center>
                      </td>
                    </tr>

                    {/* Current Draw: {graphInfo?.data?.prizePools[0].currentPrizeId}<br></br> */}
                    {/* Prize Period Ends: {graphInfo?.data?.multipleWinnersPrizeStrategies[0].prizePeriodEndAt}   */}
                    {/* 
                    <tr>
                      <td className="tdcenter">
                        <img src="./images/yolo_nolo.png" className="cool-pooly" alt="POOLY" />
                        </td>
                    </tr> */}
                    {/* https://i.ibb.co/0Jgj6DL/pooly44.png */}
                    {/* {addressValue === "" ? <tr>
                    <td className="tdcenter"><img src="./ images/yolo_nolo.png" className="cool-pooly" /></td></tr> : ""} */}

                    {/* {prizesWon === 0 && !popup && addressValue !== "" && <tr><td className="tdcenter">
                     No wins yet, friend.<br/> 
                    <img src="./images/yolo_nolo.png" className="cool-pooly" /></td></tr>} */}
                  
                  {/* <table className="padded bottom-table"><thead><tr><td><center>
                    <br></br></center> </td></tr></thead></table>*/}
                </table>
<br></br>
                <table className=" middle-table">
                  <tr>
                    <td style={{ textAlign: "left" }}>
                      {" "}
                      <center>
                        <table className="inner-middle-table">
                          <tr>
                            <td>
                              <center>
                                {/* TODO if they have no TOKEN embed or link to swap */}
                                <span className="text-two">
                                 Pool your POOL to win POOL
                                </span>

                                {/* <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> */}


                                <br></br>
                                <span className="text-two">
                                
                                {
                            poolInfo.numberOfWinners
                          }
                          
                                  &nbsp;winners every week
                                </span>

                                <br></br>
                                <span className="text-four">
1% withdraw fee if &lt;14 days</span>
                              </center>
                            </td>
                          </tr>
                        </table>
                      </center>

                      {/* Alternate Lingo
                      Staked ETH tokens are pooled
                      With ETH yield everyone wins
                      50% to a protocol specified charity
                      50% to two lucky winners per week
                      Withdraw in full anytime after 7 days */}

                      {/* <img
                          src="images/moreinfo.png"
                          className="more-info"
                        ></img>&nbsp;<span className="info-text">MORE INFO</span> */}
                    </td>
                  </tr>
                </table>
                {/* 
                        {parseInt(graphInfo?.data?.prizePools[0].currentPrizeId) > 0 && <span><br></br>
                       
                          Sponsors:<br></br>
                          {graphInfo?.data.controlledTokenBalances.map((sponsor) => (
                            <tr>
                              <td>{sponsor.account.id}</td>
                              <td>{ethValue(sponsor.balance)}</td>
                            </tr>
                          ))}
                          
                        </span>} */}
                <br></br>
                
                {isConnected && (
                  <div className="bottom-table ">
                    <table className="padded">
                        <th>
                          {" "}
                          <center>
                            {popup && (
                              <span>
                                &nbsp;&nbsp;
                                <div
                                  className="smallLoader"
                                  style={{ display: "inline-block" }}
                                ></div>
                              </span>
                            )}

                            <table className="wallet-table top-padded">
                              <div className="padding-top"></div>
                              {/* {!isConnected && <span className="right-float">Connect your wallet amigo</span>} */}

                              {isConnected &&
                                balances[0].TOKEN.gt(BNZERO) && (
                                  <tr>
                                    <td>
                                      <span className="token-text">POOL</span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {" "}
                                      <img
                                        src="/images/pool.png"
                                        className="pool-token"
                                      ></img>
                                      &nbsp;
                                      <span className="token-text">{NumberChop(ethers.utils.formatUnits(balances[0].TOKEN,18))}</span>
                                    </td>
                                  </tr>
                                )}

                              {isConnected && 
                                balances[0].TICKET.gt(BNZERO) && (
                                  <tr>
                                    <td>
                                      <span className="token-text">TICKET</span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      <img
                                        src="/images/trophyeth.png"
                                        className="trophy-token"
                                      ></img>
                                      &nbsp;
                                      <span className="token-text">{NumberChop(ethers.utils.formatUnits(balances[0]?.TICKET,18))}</span>
                                    </td>
                                  </tr>
                                )}

                              {isConnected && balances[0].SPONSORSHIP.gt(BNZERO) && (
                                <tr>
                                  <td><span className="token-text">SPONSORSHIP</span></td>
                                  <td style={{ textAlign: "right" }}>
                                  <img
                                        src="/images/trophy.png"
                                        className="trophy-token"
                                      ></img>
                                      &nbsp;
                                      <span className="token-text">{NumberChop(ethers.utils.formatUnits(balances[0].SPONSORSHIP,18))}</span>
                                  </td>
                                </tr>
                              )}
                            </table>
                          </center>
                        </th>
                   
                    </table>
                    <table className="bottom-table padded bottom-table">
                    
                        <tr>
                          <td>
                            <center>
                              <div className="wallet-buttons padding-bottom">
                                <GetTOKENNow />
                                <DepositButton />
                                <WithdrawButton />
                              </div>
                            </center>{" "}
                          </td>
                        </tr>
                      
                    </table>
                    </div>
                
                    
                )}
           </div>
            </center>
          </div>
          
        }
      </div>
      <Modal
        isOpen={isModalOpen}
        style={{
          overlay: {
            position: "fixed",
            margin: "auto",
            top: "10%",
            borderRadius: 10,
            width: 400,
            height: 300,
            backgroundColor: "#343368",
            color: "black",
          },
          content: { inset: "34px" },
        }}
      >
        <center>
          <div className="closeModal close" onClick={() => closeModal()}></div>
        {modalFocus === "award" && (
          <div>
             <div
                className="closeModal close"
                onClick={() => closeModal()}
              ></div>
              {!isConnected && "Please connect wallet"}

              {isConnected && (
                <>AWARD PRIZES <br /><br />
                
                {awardStatus?.canStart === true && <span>
                <button
                      onClick={() => startAward()}
                      className="myButton purple-hover"
                    >STEP 1 of 2 START AWARD</button></span>}
                    {awardStatus?.canComplete === true && <span>

                    <button
                      onClick={() => completeAward()}
                      className="myButton purple-hover"
                    >STEP 2 of 2 COMPLETE AWARD</button></span>}

              
              </>
              )}
          </div>
        )}
          {modalFocus === "wallet" && (
            <div>
              <div
                className="closeModal close"
                onClick={() => closeModal()}
              ></div>
              {!isConnected && "Please connect wallet"}

              {isConnected && (
                <>
                  {" "}
                  DEPOSIT on
                  {/* <img
              src={"./images/" + chain.name.toLowerCase() + ".png"}
              className="emoji"
              alt={chain.name}
            /> */}
                  <img
                    src={"./images/polygon.png"}
                    className="emoji"
                    alt={chain.name}
                  />&nbsp;
                  {chain.name}
                  <br></br>
                  {allowances.TOKEN !== undefined && (
                    <div className="amount-container">
                      <table className="table-inputamount">
                        <tr>
                          <td>
                            <img
                              src="./images/pool.png"
                              className="poolicon"
                              alt="TOKEN"
                            />{" "}
                            POOL &nbsp;
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className="wallet-message">
                              {walletMessage !== "" && walletMessage}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2}>
                            <input
                              type="text"
                              className="amount-input"
                              value={inputAmount}
                              ref={amountInput}
                              onChange={(e) => {
                                setWalletMessage("");
                                setInputAmount(e.target.value);
                              }}
                            ></input>
                          </td>
                        </tr>

                        <tr>
                          <td colSpan={2} style={{ textAlign: "right" }}>
                            <span className="small-balance">
                              Balance {NumberChop(ethers.utils.formatUnits(balances[0].TOKEN,18))}
                              {balances[0].TOKEN.gt(BNZERO) && (
                                <span
                                  className="max-balance"
                                  onClick={(e) =>
                                    setInputAmount(ethers.utils.formatUnits(balances[0].TOKEN,18))
                                  }
                                >
                                  &nbsp;MAX
                                </span>
                              )}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>
                  )}
                  {depositFetching || approveFetching ? (
                    <span>
                      <span>
                        <span className="pending-text">
                          TRANSACTION PENDING
                        </span>
                        &nbsp;&nbsp;
                        <div
                          className="verySmallLoader"
                          style={{ display: "inline-block" }}
                        ></div>
                      </span>
                    </span>
                  ) : depositLoading || approveLoading ? (
                    <span>
                      <span className="pending-text">PENDING CONFIRMATION</span>
                      &nbsp;&nbsp; &nbsp;&nbsp;
                      <div
                        className="verySmallLoader"
                        style={{ display: "inline-block" }}
                      ></div>
                    </span>
                  ) : 
                  
                  parseFloat(allowances.TOKEN) / 1e6 >=
                      parseFloat(Number(inputAmount)) &&
                    parseFloat(allowances.TOKEN) !== 0 ? (
                    <button
                      onClick={() => depositTo()}
                      className="myButton purple-hover"
                    >
                      {/* {depositLoading && "DEPOSITING..."}
                  {depositIdle && "DEPOSIT"}
                  {isDepositError && "DEPOSIT ERROR, TRY AGAIN"}
                  {depositWaitSuccess && "DEPOSIT SUCCESSFUL"} */}
                      DEPOSIT
                    </button>
                  ) : (
                    <button
                      onClick={() => approve()}
                      className="myButton purple-hover"
                    >
                      {/* {approveLoading && "APPROVING..."}
                  {approveIdle && "APPROVE"}
                  {isApproveError && "APPROVE ERROR, TRY AGAIN"}
                  {approveSuccess && "APPROVE SUCCESSFUL"} */}
                      APPROVE
                    </button>
                  )}
                </>
              )}
              <br></br>
            </div>
          )}
          {modalFocus === "winners" && <div><div
                className="closeModal close"
                onClick={() => closeModal()}
              ></div>
              
              <span>DRAW {prizeMap.drawId} WINNERS</span><br></br><br></br><table className="winner-table">
              
              {prizeMap.winnerMap.map(winner=>{ return(
                <tr><td>{winner.winner.startsWith("0x7cf2eb") ? <span>GC</span> :
                <img src="images/trophy.png" className="winner-icon"></img>}</td>
                
                <td><span className="winner-address">
                  {winner.winner.substring(0,8)}&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  {winner.winner.toLowerCase() === address?.toLowerCase() && <span>&nbsp;<img src="/images/poolerson.png" className="myaddress" /> </span>}

                  </td>
                <td style={{ textAlign: "right" }}>&nbsp;&nbsp;
                <img src="images/pool.png" className="winner-icon"></img>&nbsp;
                <span className="winner-amount">{NumberChop(winner.amount/1e18)}</span></td></tr>)
              })}
              </table><br></br>Awarded {TimeAgo(prizeMap.timestamp)}
              
              </div>}
              {modalFocus === "stats" && <div><div
                className="closeModal close"
                onClick={() => closeModal()}
              ></div>
              
              <span>STATS</span><br></br><br></br>
              <table className="winner-table">
              <tr><td>TVL</td>
              <td style={{ textAlign: "right" }}>
              <img src="images/pool.png" className="winner-icon"></img>
                &nbsp;{Separator(parseInt(poolInfo?.prizepool))}</td>
              </tr>
              <tr><td>Prize APR</td>
              <td style={{ textAlign: "right" }}>{(100*(52.14*((poolInfo.prizepool -
                                  poolInfo.TICKETTotalSupply -
                                  poolInfo.SPONSORSHIPTotalSupply)) / poolInfo.TICKETTotalSupply)).toFixed(2)}%</td></tr>

              <tr><td>Cumulative Prize&nbsp;&nbsp;&nbsp;</td>
              <td style={{ textAlign: "right" }}>
              <img src="images/pool.png" className="winner-icon"></img>&nbsp;

                {Separator(parseInt((prizeGross/1e18)))}</td></tr>
                </table><br></br>
                {balances[0]?.TICKET.gt(BNZERO) && <span>
                Your Weekly Odds 1 in&nbsp;
                  {NumberChop(1 / (1 - Math.pow((poolInfo?.TICKETTotalSupply - (parseFloat(balances[0]?.TICKET)/1e18)) / poolInfo?.TICKETTotalSupply, NumberOfPrizes)))}</span>}
              
              
              </div>}
              {modalFocus === "players" && <div><div
                className="closeModal close"
                onClick={() => closeModal()}
              ></div>
              
              <span>PLAYERS</span><br></br><br></br><table className="winner-table">
              
              {sponsorMap.map(sponsor=>{ return(
                <tr>
                  {/* <td>{winner.winner.startsWith("0x7cf2eb") ? <span>GC</span> :
                <img src="images/trophy.png" className="winner-icon"></img>}</td> */}
                
                <td><span className="winner-address">
                  {sponsor.account.id.substring(0,8)}</span>
                  {sponsor.account.id.toLowerCase() === address?.toLowerCase() && <span>&nbsp;<img src="/images/poolerson.png" className="myaddress" /> </span>}

                  </td>
                <td style={{ textAlign: "right" }}>&nbsp;&nbsp;&nbsp;&nbsp;
                <img src="images/pool.png" className="winner-icon"></img>&nbsp;

                <span className="winner-amount">{Separator(parseInt(sponsor.balance/1e18))}</span></td></tr>)
              })}
              </table><br></br>
              
              </div>}
          {modalFocus === "withdrawWallet" && (
            <div>
              <div
                className="closeModal close"
                onClick={() => closeModal()}
              ></div>
              {!isConnected && "Please connect wallet"}

              {isConnected && (
                <>
                  {" "}
                  WITHDRAW on
                  <img
                    src={"./images/" + "polygon" + ".png"}
                    className="emoji"
                    alt={chain.name}
                  />{" "}
                  {chain.name}
                  <br></br>
                  {/* {balances.polygon !== undefined &&  */}
                  <div className="amount-container">
                    <table className="table-inputamount">
                      <tr>
                        <td>
                          <img
                            src="./images/pool.png"
                            className="icon"
                            alt="TICKET"
                          />{" "}
                          TICKET &nbsp;
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="wallet-message">
                            {walletMessage !== "" && walletMessage}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>
                          <input
                            type="text"
                            className="amount-input"
                            value={inputAmount}
                            ref={amountInput}
                            onChange={(e) => {
                              setWalletMessage("");
                              setInputAmount(e.target.value);
                            }}
                          ></input>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ textAlign: "right" }}>
                          <span className="small-balance">
                            Balance {ethers.utils.formatUnits(balances[0].TICKET,18)}
                            {balances[0].TICKET.gt(BNZERO) && (
                              <span
                                className="max-balance"
                                onClick={(e) =>
                                  setInputAmount(ethers.utils.formatUnits(balances[0].TICKET,18))
                                }
                              >
                                &nbsp;MAX
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  {withdrawFetching ? (
                    <span>
                      <span>
                        <span className="pending-text">
                          TRANSACTION PENDING
                        </span>
                        &nbsp;&nbsp;
                        <div
                          className="verySmallLoader"
                          style={{ display: "inline-block" }}
                        ></div>
                      </span>
                    </span>
                  ) : withdrawLoading ? (
                    <span>
                      <span className="pending-text">PENDING CONFIRMATION</span>
                      &nbsp;&nbsp; &nbsp;&nbsp;
                      <div
                        className="verySmallLoader"
                        style={{ display: "inline-block" }}
                      ></div>
                    </span>
                  ) : (
                    <button
                      onClick={() => withdrawFrom()}
                      className="myButton purple-hover"
                    >
                      {withdrawButton}
                    </button>
                  )}
                </>
              )}
              <br></br>
            </div>
          )}
        </center>
     
      </Modal> <br></br> <center></center> 
      <ToastContainer />
      <br></br>
      <br></br>
      {poolInfo?.prizepool > 0 && (
        <span className="tvl">
          {chain?.id !==5 && <span>
            <span
                      onClick={() => getPlayers()}
                      className="bottom-menu"
                    >
                      PLAYERS
                    </span>
            &nbsp;&nbsp;
            <span
                      onClick={() => getWinners()}
                      className="bottom-menu"
                    >
                      WINNERS
                    </span>&nbsp;&nbsp;
                    
                    <span
                      onClick={() => getStats()}
                      className="bottom-menu"
                    >
                      STATS
                    </span>
                    </span>
                    }
        </span>
      )}
    </div>
  );
}

export default Dapp;
