export type ForestPlace='return'|'auth'|'camps'|'pacts'|'pact'|'invite'|'memory'|'settings'|'session';
export const forestPlaces:Record<ForestPlace,{target:[number,number,number];span:number;label:string;pose:string}>={
 return:{target:[-9,3.4,-4.5],span:26,label:'Dưới tán thông',pose:'stand'},
 auth:{target:[-7,3,-4],span:23,label:'Một khoảng yên đang đợi bạn.',pose:'stand'},
 camps:{target:[-6,3.3,-5.5],span:29,label:'Một chỗ ngồi cạnh nhau.',pose:'sit'},
 pacts:{target:[-3,2.4,-7],span:28,label:'Hẹn nhau bên dòng suối.',pose:'look-back'},
 pact:{target:[-1.5,2,-8],span:23,label:'Có mặt cùng nhau.',pose:'rest'},
 invite:{target:[-5,2.6,-6],span:25,label:'Một người quen đang đợi.',pose:'stand'},
 memory:{target:[-8,2.5,-6],span:24,label:'Những dấu chân vẫn ở đây.',pose:'rest'},
 settings:{target:[-6,2.8,-5],span:22,label:'Thoải mái theo cách của bạn.',pose:'groom'},
 session:{target:[-6,2.8,-5],span:24,label:'Cùng nhau, từng bước nhỏ.',pose:'rest'},
};
