import Arweave from 'arweave/web';

const arweave = Arweave.init({
    host: 'arweave.net',// Hostname or IP address for a Arweave node
    port: 80,           // Port, defaults to 1984
    protocol: 'https',  // Network protocol http or https, defaults to http
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
})

const getMyQrCodes = async(arweaveAddress) => {
    try{
      const query = {
        op: 'and',
        expr1: {
            op: 'equals',
            expr1: 'from',
            expr2: arweaveAddress
        },
        expr2: {
            op: 'equals',
            expr1: 'App-Name',
            expr2: 'perma-qr'
        }     
      }
      let data = []
      const list = await arweave.arql(query);
      if(list.length === 0){
        return []
      }else{
        list.map(txId => data.push(getTxData(txId)))
        const resultData = await Promise.all(data)
        return resultData
      }
    }catch(err){
      console.log(err)
      return []
    }  
  }

  const getTxData = async(txId) => {
    return new Promise(async function(resolve, reject){
      try{
        const tx = await arweave.transactions.get(txId)
        let data = await JSON.parse( tx.get('data', {decode: true, string: true}) )
        data.txId = txId
        resolve(data)
      }catch(err){
        resolve({error:true, err})
      }
    })
}


export{
    arweave,
    getMyQrCodes

}