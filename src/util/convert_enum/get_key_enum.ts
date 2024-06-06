import * as _ from 'lodash';

export function getEnumKeyByEnumValue(myEnum: any, enumValue: number): string | null {
    return _.findKey(myEnum, value => value === enumValue) || null;
}
