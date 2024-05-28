import { _decorator, Component, Animation, Vec2, v3, find, UITransform, CircleCollider2D } from 'cc';
const {ccclass, property} = _decorator;

import Game from './Game';

@ccclass('Net')
export default class Net extends Component {
    @property(Animation)
    anim: Animation | null = null;
    game: Game;
    private attack = 1;
    bulletLeve: number = 1;
    init(position: Vec2, game: Game, level: number) {
        this.bulletLeve = level;
        this.changeCollider();
        this.node.parent = find('Canvas');
        let pos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(v3(position.x, position.y, 0));
        this.node.setPosition(pos);
        this.game = game;

        this.anim.play('net_' + this.bulletLeve);
    }

    changeCollider() {
        let collider = this.node.getComponent(CircleCollider2D);
        collider.radius = 32 + this.bulletLeve * 8;
    }

    getAttackValue(): number {
        return this.attack * this.bulletLeve;
    }

    despawnNet() {
        this.game.despawnNet(this.node);
    }
}


/**
 * Note: The original script has been commented out, due to the large number of changes in the script, there may be missing in the conversion, you need to convert it manually
 */
// import Game from './Game';
// const {ccclass, property} = cc._decorator;
// 
// @ccclass
// export default class Net extends cc.Component {
// 
//     @property(cc.Animation)
//     anim: cc.Animation = null;
// 
//     game: Game;
//     
//     curLevel: number = 1;
// 
//     init(position: cc.Vec2, game: Game, level: number) {
//         this.curLevel = level;
//         this.node.parent = cc.director.getScene();
//         this.node.position = position;
//         this.game = game;
//         this.anim.play('net_'+this.curLevel);
//     }
// 
//     despawnNet() {
//         this.game.despawnNet(this.node);
//     }
// 
// }
