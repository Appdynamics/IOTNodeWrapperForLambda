import { LambdaTransaction } from './LambdaTransaction'

declare global {
    namespace NodeJS {
        interface Global {
            appdynamicsLambdaTransaction: LambdaTransaction
        }
    }
} 