export interface MenuItem {
    displayName: string;
    iconName: string;
    disabled: boolean;
    children?: MenuItem[];
}

let MenuModel: MenuItem[] = [{
    displayName: 'Service',
    iconName: 'close',
    disabled: false,
    children: [
        {
            displayName: 'Connect CSV',
            iconName: 'star_rate',
            disabled: false
        }, {
            displayName: 'Connect Shape',
            iconName: 'star_rate',
            disabled: false
        }, {
            displayName: 'Connect Feature',
            iconName: 'star_rate',
            disabled: false
        }, {
            displayName: 'Connect Search',
            iconName: 'star_rate',
            disabled: false
        }
    ]
}, {
    displayName: 'Monitor',
    iconName: 'close',
    disabled: false,
    children: [
        {
            displayName: 'Connect SENSORS',
            iconName: 'star_rate',
            disabled: false
        }, {
            displayName: 'Connect AIS/VTS',
            iconName: 'star_rate',
            disabled: true
        }
    ]
}];

export { MenuModel }