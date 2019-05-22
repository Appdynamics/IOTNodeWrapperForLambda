import { DataTypeMap } from '../index';
declare class AWSInterceptor {
    static defaultParams: DataTypeMap;
    static setProperties(srcproperties: DataTypeMap, newprop: DataTypeMap): DataTypeMap;
    static init(awsData?: DataTypeMap): void;
}
export { AWSInterceptor };
