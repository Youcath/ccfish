// 定义一个接口，用来对应json配置文件转成对象
interface FishType{
    name: string;
    oddsUp: number;  // 基础赔率上限
    oddsDown: number; // 基础赔率下限
    multipleUp: number; // 翻倍数上限
    multipleDown: number; // 翻倍数下限
    w: number;  // 碰撞宽
    h: number;  // 碰撞长
    x: number;  // 碰撞体针对图片的中心偏移
    y: number;
    dirx: number; // 初始朝向的单位向量坐标，通常朝右为（1,0）
    diry: number;

    group: Array<string>;  // 多种鱼组合的类型，为鱼配置的name数组，如三元四喜
    combine: string;   // 组合方式，line为线型组合，center为中心聚合
    appearance: string;   // normal普通鱼，odds显示即时倍率，bubble被泡沫包裹

    baseHp: number; // 基础血量，通常为0，保证鱼至少被打击一定次数后才会死亡
    countLimit: number; // 同时存在的数量上限，0表示无限制

    birthEffect: string; // 标识出场效果，为空则没有效果
    dieEffect: string;  // 标识死亡效果，为空则为normal死亡效果，treasure为攒彩金
}

// 鱼的生命状态
enum FishState {
    alive,
    dying,  // 已经死亡但尸体还会参与动画，故要保留节点
    dead,    // 已经死亡，需要销毁节点
    destroy  // 正在销毁节点，需要跳过死亡逻辑
}

export { FishState };
export type { FishType };