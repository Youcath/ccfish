// 定义一个接口，用来对应json配置文件转成对象
interface FishType{
    name: string;
    oddsUp: number,  // 基础赔率上限
    oddsDown: number, // 基础赔率下限
    multipleUp: number, // 翻倍数上限
    multipleDown: number, // 翻倍数下限
    weight: number;
    w: number;  // 碰撞宽
    h: number;  // 碰撞长
    x: number;  // 碰撞体针对图片的中心偏移
    y: number
}

// 鱼的生命状态
enum FishState {
    alive,
    dead
}

export { FishState };
export type { FishType };