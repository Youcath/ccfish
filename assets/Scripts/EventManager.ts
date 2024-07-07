import { _decorator, Component, EventTouch, KeyCode, Node, UITransform, v3 } from 'cc';
import { Player } from './Player';
import { Utils } from './utils/Utils';
import { Constant } from './config/Constant';
const { ccclass, property } = _decorator;

@ccclass('EventManager')
export class EventManager extends Component {
    
    public handleKeyboardEventForPlayers(keyCode: KeyCode, players: Map<number, Node>) {
        if (Constant.IGNORE_ALL_INPUT) return;

        switch (keyCode) {
            // 玩家1
            case KeyCode.ARROW_LEFT:
                players.get(1).getComponent(Player).weaponLeft();
                break;
            case KeyCode.ARROW_RIGHT:
                players.get(1).getComponent(Player).weaponRight();
                break;
            case KeyCode.SPACE:
            case KeyCode.ENTER:
                players.get(1).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_1:
                players.get(1).getComponent(Player).cheatCoins();
                break;

            // 玩家2
            case KeyCode.KEY_W:
                players.get(2).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_S:
                players.get(2).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_X:
                players.get(2).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_2:
                players.get(2).getComponent(Player).cheatCoins();
                break;

            // 玩家3
            case KeyCode.KEY_E:
                players.get(3).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_D:
                players.get(3).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_C:
                players.get(3).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_3:
                players.get(3).getComponent(Player).cheatCoins();
                break;

            // 玩家4
            case KeyCode.KEY_R:
                players.get(4).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_F:
                players.get(4).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_V:
                players.get(4).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_4:
                players.get(4).getComponent(Player).cheatCoins();
                break;

            // 玩家5
            case KeyCode.KEY_T:
                players.get(5).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_G:
                players.get(5).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_B:
                players.get(5).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_5:
                players.get(5).getComponent(Player).cheatCoins();
                break;

            // 玩家6
            case KeyCode.KEY_Y:
                players.get(6).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_H:
                players.get(6).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_N:
                players.get(6).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_6:
                players.get(6).getComponent(Player).cheatCoins();
                break;

            // 玩家7
            case KeyCode.KEY_U:
                players.get(7).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_J:
                players.get(7).getComponent(Player).weaponRight();
                break;
            case KeyCode.KEY_M:
                players.get(7).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_7:
                players.get(7).getComponent(Player).cheatCoins();
                break;

            // 玩家8
            case KeyCode.KEY_I:
                players.get(8).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_K:
                players.get(8).getComponent(Player).weaponRight();
                break;
            case KeyCode.COMMA:
                players.get(8).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_8:
                players.get(8).getComponent(Player).cheatCoins();
                break;

            // 玩家9
            case KeyCode.KEY_O:
                players.get(9).getComponent(Player).weaponLeft();
                break;
            case KeyCode.KEY_L:
                players.get(9).getComponent(Player).weaponRight();
                break;
            case KeyCode.PERIOD:
                players.get(9).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_9:
                players.get(9).getComponent(Player).cheatCoins();
                break;

            // 玩家10
            case KeyCode.KEY_P:
                players.get(10).getComponent(Player).weaponLeft();
                break;
            case KeyCode.SEMICOLON:
                players.get(10).getComponent(Player).weaponRight();
                break;
            case KeyCode.SLASH:
                players.get(10).getComponent(Player).shot();
                break;
            case KeyCode.DIGIT_0:
                players.get(10).getComponent(Player).cheatCoins();
                break;
        }
    }

    public handleTouchEventForPlayers(event: EventTouch, players: Map<number, Node>) {
        if (Constant.IGNORE_ALL_INPUT) return;
        
        // 所有炮台往触点发射炮弹
        players.forEach((v, k) => {
            let world = v3(event.getUILocation().x, event.getUILocation().y);
            v.getComponent(Player).setTargetPos(world);
            // 触点是世界坐标，需要转换为和炮台一致的坐标系下
            let touchPos = v.getComponent(UITransform).convertToNodeSpaceAR(world);
            // 炮台坐标
            let weaponPos = v.getComponent(Player).weaponNode.getPosition();
            // 炮台到触点的方向向量
            let dir = touchPos.subtract(weaponPos);
            // 计算夹角，这个夹角是带方向的
            let angle = Utils.angle(dir, v3(0, 1));
            //将弧度转换为欧拉角
            let degree = angle / Math.PI * 180;
            // 设置炮台角度
            v.getComponent(Player).weaponNode.angle = degree;
            v.getComponent(Player).shot();
        });
    }
}

