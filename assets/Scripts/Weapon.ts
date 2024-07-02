import { _decorator, Component, Animation, AudioSource, SpriteFrame, Sprite, v3, tween } from 'cc';
import { Utils } from './utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('Weapon')
export default class Weapon extends Component {
    @property(SpriteFrame)
    level1: SpriteFrame;
    @property(SpriteFrame)
    level2: SpriteFrame;
    @property(SpriteFrame)
    level3: SpriteFrame;
    @property(SpriteFrame)
    level4: SpriteFrame;
    curLevel: number;
    total: number;
    audio: AudioSource;

    init() {
        this.curLevel = 1;
        this.audio = this.node.getComponent(AudioSource);

    }
    // 1~8
    setLevel(l: number) {
        this.curLevel = l;
        this.audio.play();

        const n = Math.round(l / 2);
        let frame: SpriteFrame = null;
        if (l <= 2) {
            frame = this.level1;
        } else if (l <= 4) {
            frame = this.level2;
        } else if (l <= 6) {
            frame = this.level3;
        } else if (l <= 8) {
            frame = this.level4;
        }
        if (l % 2 > 0) {
            this.node.scale = v3(0.8, 0.8, 1);
        } else {
            this.node.scale = v3(1, 1, 1);
        }
        this.node.getComponent(Sprite).spriteFrame = frame;
    }

    playShot() {
        // 震动方向为向量（0， -1）
        tween(this.node).by(0.2, { position: v3(0, -1), scale: v3(0.1, 0.1) }, {
            easing: Utils.easingOne
        }).start();
    }
}