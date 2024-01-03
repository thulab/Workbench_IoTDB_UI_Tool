<template>
  <div
    id="captcha"
    @click="onRefresh()"
    style="display: inline-block; overflow: hidden;"
    :style="{ width: width + 'px', height: height + 'px' }"
  >
    <canvas ref="captchaContainer"></canvas>
  </div>
</template>

<script setup lang="ts">

const captchaContainer = ref<HTMLCanvasElement | null>(null);

const props = defineProps({
  width: {
    type: Number,
    default: 100,
  },
  height: {
    type: Number,
    default: 30,
  },
});
let code = '';

const emit = defineEmits(['update:code']);

const allLetter = '0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z'.split(',');

/** 生成一个随机数* */
const randomNum = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
/** 生成一个随机色* */
const randomColor = (min: number, max: number) => {
  const r = randomNum(min, max);
  const g = randomNum(min, max);
  const b = randomNum(min, max);
  return `rgb(${r},${g},${b})`;
};

const onRefresh = () => {
  code = '';
  if (!captchaContainer.value) return;
  const ctx = captchaContainer.value.getContext('2d');
  if (!ctx) return;
  const { height, width } = props;
  // 清空画布
  ctx.clearRect(0, 0, width, height);

  ctx.textBaseline = 'middle';

  ctx.fillStyle = randomColor(180, 240);
  // ctx.fillRect(0, 0, width, height);

  for (let i = 1; i <= 4; i++) {
    const txt = allLetter[randomNum(0, allLetter.length)];
    code += txt;
    ctx.font = `${randomNum(height / 2, height)}px SimHei`; // 随机生成字体大小
    ctx.fillStyle = randomColor(50, 160); // 随机生成字体颜色
    ctx.shadowOffsetX = randomNum(-1, 1);
    ctx.shadowOffsetY = randomNum(-1, 1);
    ctx.shadowBlur = randomNum(-3, 3);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    const x = (width / 5) * i;
    const y = height / 2;
    const deg = randomNum(-30, 30);
    /** 设置旋转角度和坐标原点* */
    ctx.translate(x, y);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.fillText(txt, 0, 0);
    /** 恢复旋转角度和坐标原点* */
    ctx.rotate((-deg * Math.PI) / 180);
    ctx.translate(-x, -y);
  }
  /** 绘制干扰线* */
  // for (let i = 0; i < 1; i++) {
  //   ctx.strokeStyle = randomColor(40, 180);
  //   ctx.beginPath();
  //   ctx.moveTo(randomNum(0, width), randomNum(0, height));
  //   ctx.lineTo(randomNum(0, width), randomNum(0, height));
  //   ctx.stroke();
  // }
  /** 绘制干扰点* */
  for (let i = 0; i < width / 4; i++) {
    ctx.fillStyle = randomColor(0, 255);
    ctx.beginPath();
    ctx.arc(randomNum(0, width), randomNum(0, height), 1, 0, 2 * Math.PI);
    ctx.fill();
  }
  emit('update:code', code.toLowerCase());
};

onMounted(() => {
  onRefresh();
});

defineExpose({ onRefresh });

</script>
