let selectedEntity = null

let cam = null

let ticker = null
let toggle = false

RegisterCommand(
  'setveh',
  (src, args, raw) => {
    let veh = GetVehiclePedIsIn(GetPlayerPed(-1), false)

    if (!veh) {
      log('veh not found')
      clearTick(ticker)
      ticker = null
      return
    }

    log('Setting entity')
    setEntity(veh)

    log('Setting tick')
    if (ticker != null) {
      clearTick(ticker)
      ticker = null
    }
    ticker = setTick(() => {
      DisableControlAction(2, 80, true)

      if (IsDisabledControlJustReleased(0, 80)) {
        if (!toggle) {
          _focusOn()
        } else {
          _focusOff()
        }
        toggle = !toggle
      }
    })
  },
  false
)

RegisterCommand(
  'putped',
  (src, args, raw) => {
    log('called put ped...')

    if (
      !selectedEntity ||
      !DoesEntityExist(selectedEntity) ||
      !IsEntityAVehicle(selectedEntity)
    ) {
      log('Please select a vehicle first (/setveh)')
    }

    log('putting ped...')

    let pedHash = GetHashKey('u_m_y_tattoo_01')

    RequestModel(pedHash)

    let loadCnt = 0
    let cancel = false

    while (!HasModelLoaded(pedHash) && !cancel) {
      loadCnt++
      if (loadCnt > 10) {
        cancel = true
        return
      }
      Wait(500)
    }

    if (cancel) {
      log('Could not load model within 5s')
      return
    }

    let ped = CreatePedInsideVehicle(selectedEntity, 4, pedHash, -1, true, true)

    SetBlockingOfNonTemporaryEvents(ped)
    TaskVehicleDriveWander(ped, selectedEntity, 120, 2884156)

    log('put ped in veh')
  },
  false
)

function _setEntity(entity) {
  /**/
  if (selectedEntity != null) {
    if (toggle) {
      _focusOff()
    }
  }
  /**/
  selectedEntity = entity
}

let t_UpdateCamPos = null
function _focusOn() {
  // should never be called, but still leaving "just in case" :p
  //if (focused) _focusOff()

  if (selectedEntity == null) {
    log('Tried to focus, but entity is invalid')
    clearTick(ticker)
    _focusOff()
    return
  }

  if (!DoesCamExist(cam)) {
    cam = CreateCameraWithParams(
      //26379945,
      'DEFAULT_SCRIPTED_CAMERA',
      GetGameplayCamCoord(),
      GetGameplayCamRot(2),
      GetGameplayCamFov(),
      true,
      2
    )
  }

  PointCamAtEntity(cam, selectedEntity, 0.0, 0.0, 0, true)
  SetCamFov(cam, 40)

  if (t_UpdateCamPos != null) clearTick(t_UpdateCamPos)
  t_UpdateCamPos = setTick(updateCam)

  SetCamActive(cam, true)
  RenderScriptCams(true, 1, 500, true, false, false)
  //AnimpostfxPlay('ChopVision', 0, true)
}

const radius = 25
const heightLift = 8
function updateCam() {
  let [px, py, pz] = GetEntityCoords(GetPlayerPed(-1), false)
  let [ex, ey, ez] = GetEntityCoords(selectedEntity, false)
  const eRot = GetEntityRotation(GetPlayerPed(-1), 2)[2]

  let anglePane = (Math.atan2(px - ex, py - ey) * 180) / Math.PI
  let angleAlt = (Math.atan2(pz - ez, px - ex) * 180) / Math.PI

  let camPosX = px + Sin(anglePane) * radius,
    camPosY = py + Cos(anglePane) * radius,
    camPosZ = pz + Sin(angleAlt) * radius

  camPosX -= Cos(eRot + 90) * Cos(angleAlt)
  camPosY -= Sin(eRot + 90) * Cos(angleAlt)

  console.log({
    px,
    py,
    pz,
    heightLift,
    anglePane,
    angleAlt,
    camPosX,
    camPosY,
    camPosZ,
  })

  SetCamCoord(cam, camPosX, camPosY, camPosZ + heightLift)
  //console.log({ coord: GetCamCoord(cam), rot: GetCamRot(cam) })

  // add controls for FOV
}

function _focusOff() {
  // disable cinematic cam
  if (DoesCamExist(cam)) {
    // destroy cam
    SetCamActive(cam, false)
    DestroyCam(cam, false)
    cam = null
  }

  clearTick(t_UpdateCamPos)
  t_UpdateCamPos = null

  //SetNightvision(false)
  //AnimpostfxStop('ChopVision')
  RenderScriptCams(false, 1, 500, true, false, false)
}

// not working smh
/**/
function focus(toggle) {
  if (!DoesEntityExist(selectedEntity))
    log('Please set a valid entity firstly (exports: setEntity)')
  if (toggle) _focusOn()
  else _focusOff()
}

function setEntity(entity) {
  if (DoesEntityExist(entity)) _setEntity(entity)
  else log('Received invalid entity')
}

/**/

function log(txt) {
  emit('chat:addMessage', {
    args: [txt],
  })
}
