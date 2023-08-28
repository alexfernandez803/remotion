set -e
cd ..
cd renderer
node build.mjs --cloudrun
cd ..
cd cloudrun
pnpm run buildContainer
cd container
ARTIFACT_REGISTRY_ENV=development node submit.mjs
cd ..
cd ..
cd example
pnpm exec remotion cloudrun services rmall -f
pnpm exec remotion cloudrun sites create --site-name=testbed
pnpm exec remotion cloudrun services deploy --cpuLimit=4.0
pnpm exec remotion cloudrun render media testbed react-svg --log=verbose
