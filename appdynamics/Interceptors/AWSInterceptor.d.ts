import { BooleanMap } from '../index';
declare class AWSInterceptor {
    static defaultParams: BooleanMap;
    static setProperties(srcproperties: BooleanMap, newprop: BooleanMap): BooleanMap;
    static init(paramsToLookFor: BooleanMap, paramsToAvoid: BooleanMap): void;
}
export { AWSInterceptor };
