
import { ethers } from "ethers";
import { PROVIDERS } from "./providers.jsx"
import { ABI } from "./abi.jsx"
import { ADDRESS } from "./address.jsx"


export const CONTRACT = {
  POLYGON: {
    PRIZEPOOL: new ethers.Contract(
      ADDRESS.POLYGON.PRIZEPOOL,
      ABI.PRIZEPOOL,
      PROVIDERS.POLYGON
    ),
    PRIZESTRATEGY: new ethers.Contract(
      ADDRESS.POLYGON.PRIZESTRATEGY,
      ABI.PRIZESTRATEGY,
      PROVIDERS.POLYGON
    ),
    TOKEN: new ethers.Contract(
      ADDRESS.POLYGON.TOKEN,
      ABI.ERC20,
      PROVIDERS.POLYGON
    ),
    TICKET: new ethers.Contract(
      ADDRESS.POLYGON.TICKET,
      ABI.ERC20,
      PROVIDERS.POLYGON
    ),
    SPONSORSHIP: new ethers.Contract(
      ADDRESS.POLYGON.SPONSORSHIP,
      ABI.ERC20,
      PROVIDERS.POLYGON
    ),}
}

