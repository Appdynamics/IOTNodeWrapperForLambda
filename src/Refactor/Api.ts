import https = require('https')
import {Beacon} from './Beacon'
import { rejects } from 'assert';

class Api {

    private apiUrl:string
    private hostName = 'iot-col.eum-appdynamics.com'

    constructor(appKey: string){
        this.apiUrl = `/eumcollector/iot/v1/application/${appKey}`
    }

    // /application/{appKey}/enabled
    isAppEnabled():boolean{
        return true
    }

    //  /application/{appKey}/validate-beacons
    validateBeacons(beacons: Beacon[]){
        const postData = JSON.stringify(beacons)
        const options = {
            hostname: this.hostName,
            port: 443,
            path: this.apiUrl + '/validate-beacons',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }
        return new Promise((resolve, reject) => {

            const request = https.request(options, (response) => {
                // handle http errors
                if(!response.statusCode){ // this shouldn't be a valid scenario but typescript it stupid sometimes, I'd want an error to be thrown in this scenario
                    reject(new Error('No status code provided in response. Response: ' + response))
                }
                else if (response.statusCode < 200 || response.statusCode > 299) {
                    reject(new Error('Failed to validate beacons, status code: ' + response.statusCode))
                }
                // temporary data holder
                const body:any = []
                // on every content chunk, push it to the data array
                response.on('data', (chunk) => body.push(chunk))
                // we are done, resolve promise with those joined chunks
                response.on('end', () => {
                    var responseBody:string = body.join('')
                    if(response.statusCode == 400 || response.statusCode == 422){
                        var validationMessages = JSON.parse(responseBody)
                        for(var i = 0; i < validationMessages.messages.length; i++){
                            console.error('Validation Failure: ' + validationMessages.messages[i])
                        }
                        reject(new Error('Failed to validate beacons, status code: ' + response.statusCode))
                    } else {
                        resolve(responseBody)
                    }
                })
            })

            request.on('error', (err) => reject(err))

            // Write data to request body
            request.write(postData)
            request.end()
        })
    }

    // /application/{appKey}/beacons
    // for more information on how this is structured see
    // https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
    // https://nodejs.org/api/http.html
    sendBeacons(beacons: Beacon[]){
        console.log(beacons)
        const postData = JSON.stringify(beacons)
        console.log(postData)
        const options = {
            hostname: this.hostName,
            port: 443,
            path: this.apiUrl + '/beacons',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }
        return new Promise((resolve, reject) => {

            const request = https.request(options, (response) => {
                console.log(response.statusCode)
                // handle http errors
                if(!response.statusCode){ // this shouldn't be a valid scenario but typescript it stupid sometimes, I'd want an error to be thrown in this scenario
                    reject(new Error('No status code provided in response. Response: ' + response))
                }
                else if (response.statusCode < 200 || response.statusCode > 299) {
                    reject(new Error('Failed to send beacons, status code: ' + response.statusCode))
                }
                // temporary data holder
                const body:any = []
                // on every content chunk, push it to the data array
                response.on('data', (chunk) => body.push(chunk))
                // we are done, resolve promise with those joined chunks
                response.on('end', () => resolve(body.join('')))
            })

            request.on('error', (err) => reject(err))

            // Write data to request body
            request.write(postData)
            request.end()
        })
    }
}

export { Api }