import { _decorator, Component, error, instantiate, Node, NodePool, resources, UITransform, v3, Vec3 } from 'cc';
import { TreeMapForFish } from './utils/TreeMapForFish';
import { CommunityInfo, SceneInfo } from './config/SceneInfo';
import { FishType } from './config/FishType';
import Game from './Game';
import Fish from './Fish';
import { Player } from './Player';
import { Utils } from './utils/Utils';
import { Constant } from './config/Constant';
import { Rope } from './Rope';
const { ccclass, property } = _decorator;


@ccclass('FishManager')
export class FishManager extends Component {
    // 鱼对象池
    fishPool: NodePool;
    fishTypes: Map<string, FishType>;
    fishConmmunityIndex = 0;
    currentSceneInfo: SceneInfo;
    normalSceneInfo: SceneInfo;
    specialSceneInfos: SceneInfo[];
    specialSceneIndex = 0;
    fishes: TreeMapForFish; // 活跃的鱼集合
    isNormalScene: boolean;
    game: Game;

    init(game: Game) {
        this.game = game;
        this.fishes = new TreeMapForFish();
        this.initPools();
        this.loadFish();
    }

    private initPools() {
        // 鱼
        this.fishPool = new NodePool("Fish");
        let initCount = 10;
        for (let i = 0; i < initCount; ++i) {
            let fishPre = instantiate(this.game.fishPrefab);
            this.fishPool.put(fishPre);
        }
    }

    private async loadScene(): Promise<void> {
        // 动态加载json配置文件
        this.isNormalScene = true;
        let self = this;
        const promise1 = new Promise(function(resolve) {
            resources.load("normal_scene_config", function (err, jsonAsset) {
                self.normalSceneInfo = jsonAsset.json;
                resolve(1);
            });
        });
        const promise2 = new Promise(function(resolve) {
            resources.load("special_scene_config", function (err, jsonAsset) {
                self.specialSceneInfos = jsonAsset.json;
                resolve(1);
            });
        });
        Promise.all([promise1, promise2]).then(() => {
            self.createSceneFishes();
        })
    }

    private loadFish() {
        this.fishTypes = new Map();
        // 动态加载json配置文件
        let self = this;
        resources.load("fishconfig", function (err, jsonAsset) {
            if (err) {
                error(err.message || err);
                return;
            }
            // 加载之后转类型
            let types: FishType[] = jsonAsset.json;
            types.forEach(t => {
                self.fishTypes.set(t.name, t);
            });
            self.loadScene();
        });
    }

    public createSceneFishes() {
        // 选定场景配置信息
        if (this.isNormalScene) {
            this.currentSceneInfo = this.normalSceneInfo;
        } else {
            this.specialSceneIndex %= this.specialSceneInfos.length;
            this.currentSceneInfo = this.specialSceneInfos[this.specialSceneIndex];
            this.specialSceneIndex++;
        }
        this.scheduleCreateCommunities();
        this.schedule(this.scheduleCreateCommunities, this.currentSceneInfo.create_interval);
        this.isNormalScene = !this.isNormalScene;
    }

    private scheduleCreateCommunities() {
        if (this.currentSceneInfo.create_method == 'random') {
            let totalWeight = 0;
            for (let i = 0; i < this.currentSceneInfo.communities.length; i++) {
                totalWeight += this.currentSceneInfo.communities[i].weight;
            }

            for (let i = 0; i < this.currentSceneInfo.create_count;) {
                // 随机选定鱼群
                let randomFish = Math.random() * totalWeight;
                let typeIndex = 0;
                let tmp = 0;
                for (; typeIndex < this.currentSceneInfo.communities.length; typeIndex++) {
                    tmp += this.currentSceneInfo.communities[typeIndex].weight;
                    if (tmp > randomFish) {
                        break;
                    }
                }
                let community = this.currentSceneInfo.communities[typeIndex];

                if (this.createFishCommunity(community)) {
                    // 成功创建了鱼
                    i++;
                }

            }
        } else {
            this.currentSceneInfo.communities.forEach(c => {
                this.createFishCommunity(c);
            });
        }
    }

    createFishCommunity(community: CommunityInfo): boolean {
        if (community.type == 'alone') {
            // 独立的鱼
            let fishType = this.fishTypes.get(community.name);
            let c = (!community.count || community.count <= 0) ? 1 : community.count;
            if (fishType.countLimit && fishType.countLimit > 0) {
                // 这个鱼有数量上限
                let existCount = this.checkTypeCount(fishType);
                if (existCount >= fishType.countLimit) {
                    // 数量到达上限，不能再创建
                    return false;
                }
                c = Math.min(c, fishType.countLimit - existCount);
            }
            let news = [];
            for (let i = 0; i < c; i++) {
                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);
                const duration = Math.random() * (this.currentSceneInfo.move_duration_max - this.currentSceneInfo.move_duration_min) + this.currentSceneInfo.move_duration_min;
                const startPosition = Utils.getOutPosition();
                const firstPosition = Utils.getInnerPosition();
                const secondPosition = Utils.getInnerPosition();
                const finalPos = Utils.getFinalPosition(startPosition);
                f.swimmingBezier(startPosition, finalPos, firstPosition, secondPosition, duration, f.prepare(true));   // 贝塞尔曲线随机运动
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                news.push(cfish);
            }
            this.fishes.sets(news);
        } else if (community.type == 'circle') {
            // 圆圈从右往左出现
            let startCenter = v3(1000);  // 起点圆心
            let byCenter = v3(0);  // 起点圆心
            let finalCenter = v3(-1000);  // 终点圆心
            let c = community.count;
            let dr = 2 * Math.PI / c; // 相近两条鱼的角度间隔
            let news = [];
            for (let i = 0; i < c; i++) {
                let startPos = v3(Math.cos(i * dr) * community.extra + startCenter.x, Math.sin(i * dr) * community.extra + startCenter.y); // 根据角度计算起点
                let byPos = v3(Math.cos(i * dr) * community.extra + byCenter.x, Math.sin(i * dr) * community.extra + byCenter.y); // 根据角度计算起点
                let endPos = v3(Math.cos(i * dr) * community.extra + finalCenter.x, Math.sin(i * dr) * community.extra + finalCenter.y); // 根据角度计算终点
                let fishType = this.fishTypes.get(community.name);

                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);
                f.swimmingLinear(startPos, byPos, endPos, this.currentSceneInfo.create_interval, f.prepare(false));   // 固定直线运动
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                news.push(cfish);
            }
            this.fishes.sets(news);
        } else if (community.type == 'circle2') {
            // 圆圈从屏幕中间出现
            let c = community.count;
            let dr = 2 * Math.PI / c; // 相近两条鱼的角度间隔
            let news = [];
            for (let i = 0; i < c; i++) {
                let startAngle = dr * i; // 计算角度起点
                let fishType = this.fishTypes.get(community.name);

                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);
                f.swimmingCircle(startAngle, community.extra, this.currentSceneInfo.create_interval - 3, f.prepare(false));   // 中心转圈
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                news.push(cfish);

            }
            this.fishes.sets(news);
        } else if (community.type == 'line') {
            let fishType = this.fishTypes.get(community.name);
            const duration = Math.random() * (this.currentSceneInfo.move_duration_max - this.currentSceneInfo.move_duration_min) + this.currentSceneInfo.move_duration_min;
            const startPosition = Utils.getOutPosition();
            const firstPosition = Utils.getInnerPosition();
            const secondPosition = Utils.getInnerPosition();
            const finalPos = Utils.getFinalPosition(startPosition);

            let news = [];
            for (let i = 0; i < community.count; i++) {
                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);

                f.swimmingBezier(startPosition, finalPos, firstPosition, secondPosition, duration, f.prepare(false) + community.extra * i);   // 贝塞尔曲线随机运动
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                this.fishes.set(cfish);
                news.push(cfish);
            }
            this.fishes.sets(news);
        }
        return true;
    }

    private checkTypeCount(type: FishType): number{
        let count = 0;
        if (this.fishes.length() > 0) {
            this.fishes.values().forEach(element => {
                if (element.getComponent(Fish).fishType.name == type.name) {
                    count++;
                }
            });
        }
        return count;
    }

    public switchTarget(player: Player, num: number, ignoreUuid?: string) {
        let currentIndex = this.fishes.keys().indexOf(player.targetUuid);
        currentIndex++;
        if (currentIndex >= Math.min(this.fishes.length(), 6)) {
            currentIndex = 0;
        }
        if (ignoreUuid && this.fishes.values()[currentIndex].getComponent(Fish)._uuid == ignoreUuid) {
            currentIndex++;
            if (currentIndex >= Math.min(this.fishes.length(), 6)) {
                currentIndex = 0;
            }
        }

        let newTarget = this.fishes.values()[currentIndex].getComponent(Fish)._uuid;
        player.setTarget(newTarget);
    }

    public ringFishedGet(fish: Fish, owner: number) {
        let fishNodes = this.fishes.values();
        let i = fishNodes.length - 1;
        let targetFishes: Array<Node> = [];
        targetFishes.push(fish.node);
        for (; i >= 0 && targetFishes.length < Constant.RING_MAX_GET; i--) {
            let node = fishNodes[i];
            let f = node.getComponent(Fish);
            if (!f || f._uuid == '' || !f.hasRing || fish._uuid == f._uuid) {
                continue;
            }
            if (f.fishType.name == fish.fishType.name) {
                f.dyingNow();
                targetFishes.push(node);
            }
        }

        const pos = this.game.players.get(owner).getPosition();
        let odds = 0;

        targetFishes.forEach(node => {
            const fish = node.getComponent(Fish);
            if (fish._uuid != '') {
                this.fishes.delete(fish._uuid);
            }
            this.game.trySwitchTargetNow(node);
            const ropeNode = instantiate(this.game.lineGraphicsPrefab);
            const rope = ropeNode.getComponent(Rope);
            rope.init();
            const finalCallback = () => {
                rope.graphics.clear();
                rope.destroy();
                this.despawnFish(node);
            };

            const callback = () => {
                fish.performReceiveAnim(pos);
                rope.performReceiveAnim(pos, node.getPosition(), finalCallback);
            };
            rope.performSendAnim(pos, node.getPosition(), callback);
            odds += fish.odds * fish.multiple;
        });
        const wPos = this.game.node.getComponent(UITransform).convertToWorldSpaceAR(pos);
        this.game.scheduleOnce(() => {
            this.game.gainCoins(wPos, odds, owner);
        }, 4);
    }

    // for debug
    clearFish() {
        this.stopCreateFish();
        this.fishes.values().forEach((fish) => {
            fish.getComponent(Fish).despawnFish();
        });
    }
    // for debug
    resumeFish() {
        this.scheduleCreateCommunities();
        this.schedule(this.scheduleCreateCommunities, this.currentSceneInfo.create_interval);
    }
    // for debug
    createStayFish(community: CommunityInfo) {
        if (community.type == 'alone') {
            // 独立的鱼
            let fishType = this.fishTypes.get(community.name);
            let news = [];
            let c = (!community.count || community.count <= 0) ? 1 : community.count;
            for (let i = 0; i < c; i++) {
                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);
                f.prepare(true);  // 可以带光环
                cfish.setPosition(v3());
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                
                news.push(cfish);
            }
            this.fishes.sets(news);
        } else if (community.type == 'circle') {
            let startCenter = v3();  // 位置圆心
            let c = community.count;
            let dr = 2 * Math.PI / c; // 相近两条鱼的角度间隔
            let news = [];
            for (let i = 0; i < c; i++) {
                let startPos = v3(Math.cos(i * dr) * community.extra + startCenter.x, Math.sin(i * dr) * community.extra + startCenter.y); // 根据角度计算起点
                let fishType = this.fishTypes.get(community.name);

                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);
                f.prepare(false);  // 不带光环
                cfish.setPosition(startPos)
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                news.push(cfish);
            }
            this.fishes.sets(news);
        } else if (community.type == 'circle2') {
            // 圆圈从屏幕中间出现
            let c = community.count;
            let dr = 2 * Math.PI / c; // 相近两条鱼的角度间隔
            let news = [];
            for (let i = 0; i < c; i++) {
                let startAngle = dr * i; // 计算角度起点
                let fishType = this.fishTypes.get(community.name);

                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);
                f.swimmingCircle(startAngle, community.extra, this.currentSceneInfo.create_interval - 3, f.prepare(false));   // 中心转圈
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                news.push(cfish);

            }
            this.fishes.sets(news);
        } else if (community.type == 'line') {
            let fishType = this.fishTypes.get(community.name);
            const duration = Math.random() * (this.currentSceneInfo.move_duration_max - this.currentSceneInfo.move_duration_min) + this.currentSceneInfo.move_duration_min;
            const startPosition = Utils.getOutPosition();
            const firstPosition = Utils.getInnerPosition();
            const secondPosition = Utils.getInnerPosition();
            const finalPos = Utils.getFinalPosition(startPosition);

            let news = [];
            for (let i = 0; i < community.count; i++) {
                let cfish: Node = null;
                if (this.fishPool.size() > 0) {
                    cfish = this.fishPool.get(this);
                } else {
                    cfish = instantiate(this.game.fishPrefab);
                }
                let f = cfish.getComponent(Fish);
                f.init(this.game, fishType);

                f.swimmingBezier(startPosition, finalPos, firstPosition, secondPosition, duration, f.prepare(false) + community.extra * i);   // 贝塞尔曲线随机运动
                cfish.setSiblingIndex(2);
                this.game.onFishTouch(cfish);
                this.fishes.set(cfish);
                news.push(cfish);
            }
            this.fishes.sets(news);
        }
    }


    public stopCreateFish() {
        this.unschedule(this.scheduleCreateCommunities);
    }

    public keepAllFishStill() {
        this.fishes.values().forEach((fish) => {
            fish.getComponent(Fish).dyingNow();
        });
    }

    public despawnFish(fish: Node) {
        const f = fish.getComponent(Fish);

        if (f._uuid != "") {
            this.fishes.delete(f._uuid);
        }
        f.unuse();
        this.fishPool.put(fish);
    }
}


