import { ADDRESS, URL } from "./address";

let query = `query($prizestrategy: String!, $ticket: String!,$sponsorship: String!,$prizepool: String! ){
    multipleWinnersPrizeStrategies(where:
    {id:$prizestrategy}) {
    id,
    numberOfWinners,
      prizePeriodEndAt
    },
    controlledTokenBalances(first:70,orderBy: balance,orderDirection:desc, where:
      {controlledToken:$ticket})
    {account{id},balance},
    prizePools(where:
    {id:$prizepool}){
      cumulativePrizeGross,
      id,
      currentPrizeId,
      currentState,
      prizes (orderBy: awardedTimestamp,orderDirection: desc,first:5){
        awardedTimestamp,
        awardedControlledTokens(first:30){
          id,winner,amount,token {
            id
          }}
        id,
        totalTicketSupply
      }
    }
  }`;
// query = `query($ethwin:String!){
//   multipleWinnersPrizeStrategies(first:5) {
//     id,
//     numberOfWinners,
//       prizePeriodEndAt
//     },
// }`

export const GetSubgraphData = async (chain) => {
  chain = "POLYGON"
  const variables = {
    prizestrategy: ADDRESS[chain].PRIZESTRATEGY.toLowerCase(),
    ticket: ADDRESS[chain].TICKET.toLowerCase(),
    sponsorship: ADDRESS[chain].SPONSORSHIP.toLowerCase(),
    prizepool: ADDRESS[chain].PRIZEPOOL.toLowerCase(),
  };
  const params = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  };
  try {
    let data = await fetch(URL[chain].GRAPH, params);
    data = data.json();
    return data;
  } catch (error) {
    console.log("could not fetch from subgraph", error);
    return null;
  }
};
