import React from 'react';
import './App.css';
import QRCode from 'qrcode'
import { Grid, Typography, AppBar, Toolbar, InputBase, Button, Dialog, DialogContent, CircularProgress } from '@material-ui/core';
import { arweave, getMyQrCodes } from './arweaveService';
import styles from './styles';
import { withStyles } from '@material-ui/core/styles'
import ListUserQrCode from './ListUserQrCode';

class App extends React.Component{
  state = {
    arweaveWallet:false,
    arweaveAddress:false,
    arweaveBalance:false,
    rawBalance:false,
    userQrCodeData:false,

    qrcode: false,
    qrcodeTextGenerate:'',

    qrcodeMessage:'',

    transaction:false,
    txFee:false,
    txFeeRaw:false,
    modalTransaction:false,
    loading:false
  }

  readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort()
        reject()
      }
      reader.addEventListener("load", () => {resolve(reader.result)}, false)
      reader.readAsText(file)
    })
  }

  openFileReader = () => document.getElementById('loadAccount').click()

  loadArweaveAccount = async(e) => {
    try{
      this.setState({loading:true})
      const raw = await this.readFile(e.target.files[0])
      const arweaveWallet = JSON.parse(raw)
      const arweaveAddress = await arweave.wallets.jwkToAddress(arweaveWallet)
      const rawBalance =  await arweave.wallets.getBalance(arweaveAddress)
      const arweaveBalance = await arweave.ar.winstonToAr(rawBalance)
      const userQrCodeData = await getMyQrCodes(arweaveAddress)
      console.log(userQrCodeData)
      this.setState({arweaveAddress, arweaveBalance, rawBalance, arweaveWallet, userQrCodeData, loading:false})
    }catch(err){
      console.log(err)
      this.setState({loading:false})
      alert('Error Loading Wallet')
      return
    }
  }

 
  generateQrCode = async() => {
    try{
      const text = this.state.qrcodeMessage
      const qrcode = await  QRCode.toDataURL(text)
      this.setState({qrcode, qrcodeTextGenerate:text})
    }catch(err){
      console.log(err)
      alert('Error generating the qr code')
    }
  }

  exportQrCode = async() => {
    try{
      const link = document.createElement('a');
      link.href = this.state.qrcode;
      link.setAttribute('download', `qrcode.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }catch(err){
      console.log(err)
      alert('Erro exporing Qr Code')
    }
  }

  storeQrCode = async() => {
    try{
      if(!this.state.arweaveWallet){
        alert('Please load an Arweave Wallet')
        return
      }
      this.setState({loading:true})
      const data = await JSON.stringify({
        qrCode:this.state.qrcode,
        content:this.state.qrcodeTextGenerate
      })
      let transaction = await arweave.createTransaction({
        data
    }, this.state.arweaveWallet);
    transaction.addTag('App-Name', 'perma-qr');
    const txFee = await arweave.ar.winstonToAr(transaction.reward)
    this.setState({transaction, txFee, txFeeRaw:transaction.reward, modalTransaction:true, loading:false})
    }catch(err){
      console.log(err)
      this.setState({loading:false})
    }
  }

  confirmStoreQrCode = async() => {
    try{
      this.setState({loading:true})
      const transaction = this.state.transaction
      await arweave.transactions.sign(transaction, this.state.arweaveWallet);
      const response = await arweave.transactions.post(transaction);
      this.setState({modalTransaction:false, loading:false})
      alert('Transaction Send!, wait the confirmation to view that on permaweb')
    }catch(err){
      console.log(err)
      this.setState({loading:false})
      alert('Error Send Transaction')
    }
  }

  changeState = e => this.setState({[e.target.name]: e.target.value})

  closeModal = () => this.setState({modalTransaction:false})

  render(){
    return(
      <Grid container>
        <AppBar position="fixed" style={{alignItems:"center", backgroundColor:'grey'}}><Toolbar>
          <Typography align="center" variant="h6">Perma QR</Typography>
        </Toolbar></AppBar> 
        <Grid container style={{marginTop:70}} justify="center" alignContent="center" alignItems="center" direction="column">
        {this.state.arweaveWallet ?
          <Grid container direction="column">
            <Typography  style={{wordBreak:'break-all', padding:5}} variant="h6" align="center">{this.state.arweaveAddress}</Typography>
            <Typography variant="h6" align="center">{this.state.arweaveBalance} AR</Typography>
          </Grid>
          :
            <Button variant="contained" onClick={this.openFileReader} color="primary">Load Arweave Wallet</Button>
        }
          <input type="file" onChange={ e => this.loadArweaveAccount(e)} id="loadAccount" style={{display: "none"}}/>

        <Typography style={{marginTop:30}}>QR Code Content Text:</Typography>
        <Grid container justify="center" alignContent="center" alignItems="center" style={{maxWidth:500}} direction="column" >
                <InputBase
                      style={{backgroundColor:'#dfe6e9', padding:5}}
                      multiline
                      rows="8"
                      rowsMax="18"
                      id="qrcodeMessage"
                      name="qrcodeMessage"
                      onChange={e => this.changeState(e)}
                      value={this.state.qrcodeMessage}                
                />
             <Button style={{margin:5}} onClick={this.generateQrCode} variant="contained">Generate QR Code</Button>
        </Grid>
        </Grid>
        {this.state.qrcode &&
          <Grid container justify="center" alignContent="center" alignItems="center" direction="column">
          <img src={this.state.qrcode}/>
          <Typography>QR Code Content</Typography>
          <InputBase style={{backgroundColor:'#dfe6e9', padding:5}} multiline rowsMax="30" value={this.state.qrcodeTextGenerate}/>
          <Button style={{margin:5}} onClick={this.exportQrCode} variant="contained">Export Image</Button>
          <Button style={{margin:5}} onClick={this.storeQrCode} variant="contained">Store on Arweave</Button>
          </Grid>
        }
            <Grid container justify="center" alignContent="center" alignItems="center">
              <ListUserQrCode data={this.state.userQrCodeData} />
            </Grid>

            
            <Dialog open={this.state.modalTransaction}><DialogContent>
            <Grid container justify="center" alignContent="center" alignItems="center" direction="column">
              <Dialog open={this.state.loading}><DialogContent><CircularProgress/></DialogContent></Dialog>      
              <img src={this.state.qrcode} style={{maxWidth:300}}/>
              <InputBase style={{backgroundColor:'#dfe6e9', padding:5}} multiline rows="6" value={this.state.qrcodeTextGenerate}/>
              <Typography>Transaction Fee: {this.state.txFee}</Typography>
              {(parseInt(this.state.rawBalance)>=parseInt(this.state.txFeeRaw)) ?
                <Button onClick={this.confirmStoreQrCode} variant="contained" color="primary">Confirm Transaction</Button>
                :
                <Typography>Insuficient Funds</Typography>

              }
              <Button onClick={this.closeModal} variant="contained" color="secondary">Cancel</Button>
            </Grid>
            </DialogContent></Dialog>
            <Dialog open={this.state.loading}><DialogContent><CircularProgress/></DialogContent></Dialog>      
      </Grid>
    )
  }
}

export default withStyles(styles, { withTheme: true })(App)
