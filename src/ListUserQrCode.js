import React from 'react'
import { Typography, Grid, InputBase } from '@material-ui/core';

class ListUserQrCode extends React.Component{
    state = {

    }

    render(){
        if(this.props.data.length === 0 || !this.props.data) return null
        return(
            <Grid container justify="center" alignContent="center" alignItems="center" style={{paddingTop:35}} >
                <Typography variant="subtitle1">User QR Codes</Typography>
                <Grid container justify="center" alignContent="center" alignItems="center" direction="row">
                    {this.props.data.map(data => (
                        <Grid item direction="column"  style={{margin:15}}>
                            <Grid container justify="center" alignContent="center" alignItems="center">
                            <img src={data.qrCode} style={{maxWidth:150, maxHeight:150}} onClick={() => window.open(data.qrCode)} />
                            <InputBase style={{backgroundColor:'#dfe6e9', padding:5}} multiline rows="6" value={data.content}/>
                            </Grid>
                            <a target="_blank" href={`https://viewblock.io/arweave/tx/${data.txId}`}>View on Explorer</a>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        )
    }
}

export default ListUserQrCode