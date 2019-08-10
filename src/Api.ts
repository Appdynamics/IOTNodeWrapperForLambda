import https = require('https')
import {Beacon} from './Beacon'
import { Logger } from './Helpers/Logger';

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
        Logger.debug('Api.validateBeacons start')
        const postData = JSON.stringify(beacons)
        Logger.debug('Api.validateBeacons postData: ' + postData)
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
            Logger.debug('Api.validateBeacons.promise start')

            const request = https.request(options, (response) => {
                Logger.debug('Api.validateBeacons.promise.request start')
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
                        Logger.debug('Api.validateBeacons.promise.response is not valid, see validation messages.')
                        var validationMessages = JSON.parse(responseBody)
                        for(var i = 0; i < validationMessages.messages.length; i++){
                            Logger.warn('Validation Failure: ' + validationMessages.messages[i])
                        }
                        reject(new Error('Failed to validate beacons, status code: ' + response.statusCode))
                    } else {
                        Logger.debug('Api.validateBeacons.promise.response is valid.')
                        resolve(responseBody)
                    }
                })
                Logger.debug('Api.validateBeacons.promise.request end')
            })

            request.on('error', (err) => reject(err))

            // Write data to request body
            request.write(postData)
            request.end()
            Logger.debug('Api.validateBeacons.promise end')
        })
    }

    // /application/{appKey}/beacons
    // for more information on how this is structured see
    // https://www.tomas-dvorak.cz/posts/nodejs-request-without-dependencies/
    // https://nodejs.org/api/http.html
    sendBeacons(beacons: Beacon[]){
        Logger.debug('Api.sendBeacons start')
        const postData = JSON.stringify(beacons)
        Logger.debug('Api.sendBeacons postData: ' + postData)
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
            Logger.debug('Api.sendBeacons.promise start')

            const request = https.request(options, (response) => {
                Logger.debug('Api.sendBeacons.promise.request start')
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
                response.on('end', () => function(){
                    Logger.debug('Api.sendBeacons.promise.response end')
                    resolve(body.join(''))
                })
                Logger.debug('Api.sendBeacons.promise.request end')
            })

            request.on('error', (err) => reject(err))

            // Write data to request body
            request.write(postData)
            request.end()
            Logger.debug('Api.sendBeacons.promise end')
        })
    }
}

export { Api }