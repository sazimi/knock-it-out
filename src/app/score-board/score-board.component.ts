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
  private velocityBuffer: number[] = [0, 0, 0, 0, 0];

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
      const velocitySample = Math.abs(Math.sqrt((accl.x / dt) ** 2 + (accl.y / dt) ** 2 + (accl.z / dt) ** 2));

      if (velocitySample === Infinity) {
        return;
      }

      this.velocityBuffer.pop();
      this.velocityBuffer.unshift(velocitySample);
      let velocity = 0;

      for (let value of this.velocityBuffer) {
        velocity += value;
      }

      velocity /= this.velocityBuffer.length;
      this.maxSpeed = Math.max(this.maxSpeed, velocity);

      // no real movement (there is always noise).
      if (velocity < 0.5) {
        const punchTreshold = 3; // m/s

        if (this.maxSpeed >= punchTreshold) {
          this.updateHighScore(this.t, this.maxSpeed);
        }

        this.maxSpeed = 0;
      }
    }
  }

  updateHighScore(timestamp: number, value: number) {
    if (this.highscore.length > 10)
      return;

    this._zone.run(() => {
      const item: iHighScore = { timestamp: timestamp, value: +value.toFixed(3), isMax: false };
      this.highscore.push(item);
      let highest = Math.max(...this.highscore.map(item => item.value));
      this.highscore.forEach((item) => {
        item.isMax = +item.value === +highest ? true : false;
      })

      console.log('************ PUNCH ***********');
    });
  }

}
