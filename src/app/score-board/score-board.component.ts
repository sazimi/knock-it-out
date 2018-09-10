import { Component, NgZone } from '@angular/core';

import { Thingy52, Sensor } from './../thingy52'

interface iHighScore {
  timestamp: number;
  value: number;
  isMax: boolean;
}

interface iVector {
  x: number;
  y: number;
  z: number;
}

@Component({
  selector: 'knock-score-board',
  templateUrl: './score-board.component.html',
  styleUrls: ['./score-board.component.scss']
})
export class ScoreBoardComponent {
  ready: boolean = false;
  lastSpeed: number = 0;
  highscore: iHighScore[] = [];
  thingy = new Thingy52();


  private t: number = 0;
  private maxSpeed: number = 0;
  private gravity: iVector = { x: 0, y: 0, z: 0 };
  private linearAcceleration: iVector = { x: 0, y: 0, z: 0 };
  private accel: Sensor | null = null;

  constructor(public _zone: NgZone) {
  }

  connect() {
    this.thingy.connect();

    this.accel = new this.thingy.Accelerometer();
    this.accel!.onreading = () => {
      this.ready = true;
      let dt = this.t === 0 ? 0 : (this.accel!.timestamp - this.t);
      this.t = this.accel!.timestamp;

      const bias = 0.8;
      for (let key of ["x", "y", "z"]) {
        // @ts-ignore
        this.gravity[key] = (1 - bias) * this.gravity[key] + bias * this.accel[key];
        // @ts-ignore
        this.linearAcceleration[key] = this.accel[key] - this.gravity[key];
      }

      const accl = this.linearAcceleration;
      const velocity = Math.abs(Math.sqrt((accl.x / dt) ** 2 + (accl.y / dt) ** 2 + (accl.z / dt) ** 2));

      if (velocity === Infinity) {
        return;
      }

      this.maxSpeed = Math.max(this.maxSpeed, velocity);

      if (this.maxSpeed > 2 && velocity < this.maxSpeed / 2) {
        this.updateHighScore(this.t, this.maxSpeed);
        this.maxSpeed = 0;
      }

    }
  }

  updateHighScore(timestamp: number, value: number) {
    if (this.highscore.length >= 14)
      return;

    this._zone.run(() => {
      const item: iHighScore = { timestamp: timestamp, value: +value.toFixed(3), isMax: false };
      this.highscore.push(item);
      let highest = Math.max(...this.highscore.map(item => item.value));
      this.highscore.forEach((item) => {
        item.isMax = +item.value === +highest ? true : false;
      })

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          let list = document.querySelector('#list');
          list.children[list.children.length - 1].scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
        })

        console.log('************ PUNCH ***********');
      });
    });
  }

}
