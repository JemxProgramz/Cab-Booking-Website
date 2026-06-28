import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/');
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}

test();
