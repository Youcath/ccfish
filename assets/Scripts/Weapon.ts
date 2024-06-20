import { _decorator, Component, Animation, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Weapon')
export default class Weapon extends Component {
    @property(Animation)
    anim: Animation | null = null;
    curLevel: number;
    total: number;
    audio: AudioSource;

    init() {
        this.curLevel = 1;
        this.audio = this.node.getComponent(AudioSource);
        this.total = this.anim.clips.length;
    }
    setLevel(l: number) {
        this.curLevel = l;
        this.audio.play();
        this.anim.play('weapon_level_' + this.curLevel);
    }

}