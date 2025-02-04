
class Particle {
    constructor(x, y, vx, vy, size, color, duration, world = null, affected_by_gravity = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.duration = duration;
        this.world = world;
        this.affected_by_gravity = affected_by_gravity;

        this.el = document.createElement("div");
        this.el.className = "particle";
        this.el.style.backgroundColor = color;
        this.el.style.width = `${this.size}px`;
        this.el.style.height = `${this.size}px`;

        this.el.style.zIndex = "1000";

        document.body.appendChild(this.el);

        window.setTimeout(() => {
            this.el.className = "particle fadeout";
            window.setTimeout(() => {
                document.body.removeChild(this.el);
                this.el = null;
            }, 500);
        }, duration);

        this.interval = window.setInterval(() => this.move(), 10);
    }

    update() {
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }

    move() {
        if (!this.el) {
            window.clearInterval(this.interval);
            return;
        }

        if (this.affected_by_gravity) this.vy += this.world.gravity;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;

        this.update();
    }

}

class Body {
    constructor(x, y, w, h, solid, world, color = "red", breakable = false) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.solid = solid;
        this.world = world;
        this.color = color;
        this.breakable = breakable;
        this.id = this.world.add(this);

        this.el = document.createElement("div");
        this.el.className = "object";
        this.el.style.width = `${this.w}px`;
        this.el.style.height = `${this.h}px`;
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
        this.el.style.backgroundColor = this.color;

        document.body.appendChild(this.el)
    }

    break(vx, vy) {
        if (this.el) {
            document.body.removeChild(this.el);
            this.el = null;
            for (let i = 0; i < 10; i++) {
                let x = Math.round(Math.random() * this.w) + this.x;
                let y = Math.round(Math.random() * this.h) + this.y;

                let rx = (Math.round(Math.random() * 100) - 50) / 5;
                let ry = (Math.round(Math.random() * 100) - 50) / 5;

                let p = new Particle(x, y, vx + rx, vy + ry, 8, this.color, 200, this.world, true);
            }

            this.world.remove(this);
        }
    }
}

class Box {
    constructor(x, y, width, height, world, color = "blue") {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0
        this.grounded = false;
        
        this.w = width;
        this.h = height;
        this.color = color;

        this.el = document.createElement("div");
        this.el.className = "box";
        this.el.style.width = `${width}px`;
        this.el.style.height = `${height}px`;
        this.el.style.border = `4px solid ${this.color}`;

        this.update();
        document.body.appendChild(this.el);

        this.world = world;
        this.moveable = true;

        this.id = this.world.add(this);
    }

    update() {
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }

    get is_grounded() {
        if (!this.grounded) return false;
        if (this.world.gravity > 0) {
            for (let object of this.world.solid_objects) {
                if (this.x + this.w > object.x && object.x + object.w > this.x) {
                    if (this.y + this.h == object.y) {
                        return true;
                    }
                }
            }

            for (let mvb of this.world.moveables) {
                if (mvb !== this && mvb.grounded) {
                    if (this.x + this.w > mvb.x && mvb.x + mvb.w > this.x) {
                        if (this.y + this.h == mvb.y) {
                            return true;
                        }
                    }
                }
            }
        } else {
            for (let object of this.world.solid_objects) {
                if (this.x + this.w > object.x && object.x + object.w > this.x) {
                    if (this.y == object.y + object.h) {
                        return true;
                    }
                }
            }

            for (let mvb of this.world.moveables) {
                if (mvb !== this && mvb.grounded) {
                    if (this.x + this.w > mvb.x && mvb.x + mvb.w > this.x) {
                        if (this.y == mvb.y + mvb.h) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    move() {
        // This is gravity ONLY.
        if (this.grounded) {
            if (!this.is_grounded) this.grounded = false;
        }

        if (!this.grounded) {
            this.y += this.vy;
            this.vy += this.world.gravity;
            for (let object of this.world.solid_objects) {
                if (this.vy > 0) {
                    // Moving down
                    if (this.y < object.y && this.y + this.h > object.y) {
                        if (this.x + this.w > object.x && this.x < object.x + object.w) {
                            let in_ = this.y + this.h - object.y;
                            this.y -= in_;
                            this.vy = 0;
                            if (this.world.gravity > 0) {
                                this.grounded = true;
                            }
                            break;
                        }
                    }
                } else if (this.vy < 0) {
                    // Moving up
                    if (this.y + this.h > object.y && this.y < object.y + object.h) {
                        if (this.x + this.w > object.x && this.x < object.x + object.w) {
                            let in_ = object.y + object.h - this.y;
                            this.y += in_;
                            this.vy = 0;
                            if (this.world.gravity < 0) {
                                this.grounded = true;
                            }
                            break;
                        }
                    }
                }
            }

            for (let mvb of this.world.moveables) {
                if (mvb.grounded && mvb !== this) {
                    if (this.vy > 0) {
                        // Moving down
                        if (this.y < mvb.y && this.y + this.h > mvb.y) {
                            if (this.x + this.w > mvb.x && this.x < mvb.x + mvb.w) {
                                let in_ = this.y + this.h - mvb.y;
                                this.y -= in_;
                                this.vy = 0;
                                if (this.world.gravity > 0) {
                                    this.grounded = true;
                                }
                                break;
                            }
                        }
                    } else if (this.vy < 0) {
                        // Moving up
                        if (this.y + this.h > mvb.y && this.y < mvb.y + mvb.h) {
                            if (this.x + this.w > mvb.x && this.x < mvb.x + mvb.w) {
                                let in_ = mvb.y + mvb.h - this.y;
                                this.y += in_;
                                this.vy = 0;
                                if (this.world.gravity < 0) {
                                    this.grounded = true;
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }

        this.playermove(this.vx);

        this.update();
    }

    playermove(in_) {
        // this.vx = vx;
        this.vx = in_ * 0.9;
        // if (this.vx > 0) this.vx = Math.max(this.vx, in_ * )

        this.x += in_;
        let offset = 0;

        for (let object of this.world.solid_objects) {
            // if (object.solid) {
            if (in_ > 0) {
                // Moving right
                if (this.x <= object.x && this.x + this.w > object.x) {
                    if (object.y < this.y + this.h && this.y < object.y + object.h) {
                        let in_ = this.x + this.w - object.x;
                        this.x -= in_;
                        offset = in_;
                        break;
                    }
                }
            } else if (in_ < 0) {
                // Moving left
                if (object.x <= this.x && object.x + object.w >= this.x) {
                    if (object.y < this.y + this.h && this.y < object.y + object.h) {
                        let in_ = object.x + object.w - this.x;
                        this.x += in_;
                        offset = in_;
                        break;
                    }
                }
            }
        }

        for (let mvb of this.world.moveables) {
            if (mvb !== this) {
                if (in_ > 0) {
                    // Moving right
                    if (this.x <= mvb.x && this.x + this.w > mvb.x) {
                        if (mvb.y < this.y + this.h && this.y < mvb.y + mvb.h) {
                            // let in_ = this.x + this.size - mvb.x;
                            let in_ = mvb.playermove(this.vx);
                            this.x -= in_;
                            offset = in_;
                            break;
                        }
                    }
                } else if (in_ < 0) {
                    // Moving left
                    if (mvb.x <= this.x && mvb.x + mvb.w >= this.x) {
                        if (mvb.y < this.y + this.h && this.y < mvb.y + mvb.h) {
                            let in_ = mvb.playermove(this.vx);
                            this.x += in_;
                            offset = in_;
                            break;
                        }
                    }
                }
            }
        }

        // this.x = Math.round(this.x);
        
        this.update();

        return offset;
    }
}

class World {
    constructor() {
        this.global_id = 0;
        this.gravity = 0.2;
        this.solid_objects = [];
        this.moveables = [];
        this.player = null;

        setInterval(() => {
            if (this.player) this.player.move();
            for (let moveable of this.moveables) moveable.move();
        }, 10);
    }

    add(object) {
        if (object.solid) this.solid_objects.push(object);
        else if (object.moveable) this.moveables.push(object);
        
        return this.global_id++;
    }

    remove(object) {
        if (object.solid) this.solid_objects = this.solid_objects.filter(e => e.id !== object.id);
        else if (object.moveable) this.moveables = this.moveables.filter(e => e.id !== object.id);
    }

    set gravity_(value) {
        this.gravity = value;
        if (this.player) this.player.grounded = false;
        for (let obj of this.moveables) obj.move();
    }

    load_world(code) {
        // World codes should be the following:
        // Metadata e.g. to make id1 breakable, id2 non-solid, id3 solid, id4 moveable: 1:1-COL,2:0-COL,3:2-COL,4:3-COL;
        // Player spawn location, in the following: x,y;
        // Blocks in the following: x,y,w,h,id;

        let parts = code.split(";");
        let metadata = parts[0];
        let spawn = parts[1];
        let blocks = parts.slice(2);
        
        let values = {};

        for (let part of metadata.split(",")) {
            let [id_, code] = part.split(":");
            let [value, color_] = code.split("-");
            value = Number(value);
            values[Number(id_)] = {
                solid: value > 0,
                breakable: value == 1,
                moveable: value == 3,
                color: color_
            };
        }

        let [sx, sy] = spawn.split(",");
        sx = Number(sx);
        sy = Number(sy);

        let player = new Player(sx, sy, this);
        assign_movement_handler(player);

        for (let block of blocks) {
            let [x, y, w, h, id_] = block.split(",").map(e => Number(e));

            if (values[id_].moveable) {
                let b = new Box(x, y, w, h, this, values[id_].color);
            } else {
                let b = new Body(x, y, w, h, values[id_].solid, this, values[id_].color, values[id_].breakable);
            }
        }
    }
}

class Player {
    constructor(x, y, world, size=40) {
        this.world = world;
        this.size = size;
        this.vx = 0;
        this.vy = 0;
        this.x = x;
        this.y = y;
        this.grounded = false;
        this.can_dash = true;

        this.el = document.createElement("div");
        this.el.className = "player";
        this.el.style.width = `${this.size}px`;
        this.el.style.height = `${this.size}px`;
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;

        document.body.appendChild(this.el)
        
        this.world.player = this;
    }

    update() {
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }

    get is_grounded() {
        if (!this.grounded) return false;
        if (this.world.gravity > 0) {
            for (let object of this.world.solid_objects) {
                if (this.x + this.size > object.x && object.x + object.w > this.x) {
                    if (this.y + this.size == object.y) {
                        return true;
                    }
                }
            }

            for (let mvb of this.world.moveables) {
                if (mvb.grounded) {
                    if (this.x + this.size > mvb.x && mvb.x + mvb.w > this.x) {
                        if (this.y + this.size == mvb.y) {
                            return true;
                        }
                    }
                }
            }
        } else {
            for (let object of this.world.solid_objects) {
                if (this.x + this.size > object.x && object.x + object.w > this.x) {
                    if (this.y == object.y + object.h) {
                        return true;
                    }
                }
            }

            for (let mvb of this.world.moveables) {
                if (mvb.grounded) {
                    if (this.x + this.size > mvb.x && mvb.x + mvb.w > this.x) {
                        if (this.y == mvb.y + mvb.h) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    move() {
        if (this.grounded) {
            if (!this.is_grounded) this.grounded = false;
        }

        if (!this.can_dash && this.grounded && Math.abs(this.vx) <= 3) this.can_dash = true;
        
        this.x += this.vx;
        this.vx *= 0.9;

        if (Math.abs(this.vx) <= 0.1) this.vx = 0;

        for (let object of this.world.solid_objects) {
            // if (object.solid) {
            if (this.vx > 0) {
                // Moving right
                if (this.x <= object.x && this.x + this.size > object.x) {
                    if (object.y < this.y + this.size && this.y < object.y + object.h) {
                        if (object.breakable) {
                            if (this.vx > 5) {
                                object.break(this.vx, 0);
                                break;
                            }
                        }
                        let in_ = this.x + this.size - object.x;
                        this.x -= in_;
                        break;
                    }
                }
            } else if (this.vx < 0) {
                // Moving left
                if (object.x <= this.x && object.x + object.w >= this.x) {
                    if (object.y < this.y + this.size && this.y < object.y + object.h) {
                        if (object.breakable) {
                            if (this.vx < -5) {
                                object.break(this.vx, 0);
                                break;
                            }
                        }
                        let in_ = object.x + object.w - this.x;
                        this.x += in_;
                        break;
                    }
                }
            }
        }

        for (let mvb of this.world.moveables) {
            if (this.vx > 0) {
                // Moving right
                if (this.x <= mvb.x && this.x + this.size > mvb.x) {
                    if (mvb.y < this.y + this.size && this.y < mvb.y + mvb.h) {
                        let in_ = this.x + this.size - mvb.x;
                        in_ = mvb.playermove(in_);
                        this.x -= in_;
                        break;
                    }
                }
            } else if (this.vx < 0) {
                // Moving left
                if (mvb.x <= this.x && mvb.x + mvb.w >= this.x) {
                    if (mvb.y < this.y + this.size && this.y < mvb.y + mvb.h) {
                        let in_ = mvb.x + mvb.w - this.x;
                        in_ = mvb.playermove(-in_);
                        this.x += in_;
                        break;
                    }
                }
            }
        }

        this.x = Math.round(this.x);

        this.y += this.vy;
        for (let object of this.world.solid_objects) {
            if (this.vy > 0) {
                // Moving down
                if (this.y < object.y && this.y + this.size > object.y) {
                    if (this.x + this.size > object.x && this.x < object.x + object.w) {
                        let in_ = this.y + this.size - object.y;
                        this.y -= in_;
                        this.vy = 0;
                        if (this.world.gravity > 0) {
                            this.grounded = true;
                            this.can_dash = true;
                        }
                        break;
                    }
                }
            } else if (this.vy < 0) {
                // Moving up
                if (this.y + this.size > object.y && this.y < object.y + object.h) {
                    if (this.x + this.size > object.x && this.x < object.x + object.w) {
                        let in_ = object.y + object.h - this.y;
                        this.y += in_;
                        this.vy = 0;
                        if (this.world.gravity < 0) {
                            this.grounded = true;
                            this.can_dash = true;
                        }
                        break;
                    }
                }
            }
        }

        for (let mvb of this.world.moveables) {
            if (mvb.grounded) {
                if (this.vy > 0) {
                    // Moving down
                    if (this.y < mvb.y && this.y + this.size > mvb.y) {
                        if (this.x + this.size > mvb.x && this.x < mvb.x + mvb.w) {
                            let in_ = this.y + this.size - mvb.y;
                            this.y -= in_;
                            this.vy = 0;
                            if (this.world.gravity > 0) {
                                this.grounded = true;
                                this.can_dash = true;
                            }
                            break;
                        }
                    }
                } else if (this.vy < 0) {
                    // Moving up
                    if (this.y + this.size > mvb.y && this.y < mvb.y + mvb.h) {
                        if (this.x + this.size > mvb.x && this.x < mvb.x + mvb.w) {
                            let in_ = mvb.y + mvb.h - this.y;
                            this.y += in_;
                            this.vy = 0;
                            if (this.world.gravity < 0) {
                                this.grounded = true;
                                this.can_dash = true;
                            }
                            break;
                        }
                    }
                }
            }
        }

        if (!this.grounded) {
            this.vy += this.world.gravity;
        }

        this.update();
    }
}

let held = {}
function assign_movement_handler(player) {
    document.body.onkeydown = ev => {
        if (ev.key.toLowerCase() === " " || ev.key.toLowerCase() === "w") {
            if (player.grounded) {
                if (w.gravity > 0) player.vy = -10;
                else player.vy = 10;
                player.grounded = false;
            }
        } 

        // if (ev.key.toLowerCase() === " ") {
        //     w.gravity_ = w.gravity * -1;
        //     player.grounded = false;
        // }

        if (ev.key === "Shift") {
            if (player.can_dash) {
                player.vx = 30 * Math.sign(player.vx);
                player.can_dash = false;
            }
        }
        
        else if (ev.key === "a") held["a"] = true;
        else if (ev.key === "d") held["d"] = true;
    }

    document.body.onkeyup = ev => {
        if (ev.key.toLowerCase() === "a") held["a"] = false;
        if (ev.key.toLowerCase() === "d") held["d"] = false;
    }

    setInterval(() => {
        if (held["a"]) player.vx = Math.min(-3, player.vx);
        if (held["d"]) player.vx = Math.max(3, player.vx);
    }, 10);
}

w = new World();
// p = new Player(130, 90, w);
// o = new Body(0, 1000, 1920, 80, true, w);

// o2 = new Body(0, 0, 100, 1080, true, w);
// o3 = new Body(600, 820, 80, 80, true, w, true);

// b = new Box(250, 90, 40, 40, w);

// assign_movement_handler(p);

w.load_world("0:2-black,1:1-black,2:3-blue;130,90;0,1000,1920,80,0;0,0,100,1080,0;600,820,80,80,1;620,90,40,40,2");
