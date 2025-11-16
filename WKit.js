const WKit = {};

/* Public API: data mapping */
WKit.pipeForDataMapping = function (targetInstance) {
  const currentPage = wemb.isPage(targetInstance) ? targetInstance : targetInstance.page;
  return new Promise((res, rej) => {
    fx.go(resolveMappingInfo(targetInstance), fx.map(getDataFromMapping.bind(currentPage)))
      .then(res)
      .catch(rej);
  });
};

/* Public API: 2D event binding */
WKit.bindEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.map(([eventName, selectorList]) => {
      fx.map((selector) => {
        const handler = makeHandler(instance, selector);
        delegate(instance, eventName, selector, handler);
      }, Object.keys(selectorList));
    })
  );
};

WKit.removeCustomEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.map(([eventName, selectorList]) => {
      fx.map((selector) => {
        const handler = instance.userHandlerList?.[eventName]?.[selector];
        if (handler) {
          instance.element.removeEventListener(eventName, handler);
        }
      }, Object.keys(selectorList));
    })
  );
};

/* Public API: 3D event binding */

WKit.initThreeRaycasting = function (target, eventName) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const { scene, camera } = wemb.threeElements;
  const onRaycasting = makeRaycastingFn(target, raycaster, mouse, scene, camera);
  target.addEventListener(eventName, onRaycasting);
  return onRaycasting;
};

WKit.bind3DEvents = function (instance, customEvents) {
  instance.appendElement.eventListener = {};
  fx.map((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};

/* Public API: 3D dispose */
WKit.dispose3DTree = function (rootContainer) {
  rootContainer.traverse((obj) => {
    // 1. geometry
    if (obj.geometry) {
      obj.geometry.dispose?.();
    }

    // 2. material(s)
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat) => {
          disposeMaterial(mat);
        });
      } else {
        disposeMaterial(obj.material);
      }
    }

    // 3. textures (in material, handled inside disposeMaterial)

    // 4. eventListener (custom-defined on your side)
    if (obj.eventListener) {
      Object.keys(obj.eventListener).forEach((eventType) => {
        obj.eventListener[eventType] = undefined;
      });
      obj.eventListener = undefined;
    }

    // 5. 기타 사용자 정의 데이터
    if (obj.userData) {
      obj.userData = {};
    }
  });

  // 부모로부터 detach
  if (rootContainer.parent) {
    rootContainer.parent.remove(rootContainer);
  }
};

WKit.clearSceneBackground = function (scene) {
  const bg = scene.background;

  if (bg && bg.dispose) {
    bg.dispose(); // Texture나 CubeTexture일 경우만 dispose 존재
  }

  scene.background = null;
};

/* Public API: helper */
WKit.makeIterator = function (page, ...layerList) {
  layerList = layerList.length ? layerList : ['masterLayer', 'twoLayer', 'threeLayer'];
  const mapName = {
    masterLayer: 'componentInstanceListMap',
    twoLayer: 'componentInstanceListMap',
    threeLayer: '_appendElementListMap',
  };
  return combineIterators(
    fx.go(
      layerList,
      fx.map((layer) => page?.[layer]?.[mapName[layer]]?.values())
    )
  );
};

WKit.getInstanceByName = function (instanceName, iter) {
  return fx.find((ins) => ins.name === instanceName, iter);
};

WKit.getInstanceById = function (targetId, iter) {
  return fx.find((ins) => ins.id === targetId, iter);
};

WKit.fetchData = function (page, datasetName, param) {
  return new Promise((res, rej) => {
    page.dataService
      .call(datasetName, { param })
      .on('success', (data) => res(data))
      .on('error', (err) => rej(err));
  });
};

WKit.emitEvent = function (eventName, targetInstance) {
  console.log('[WKit:EmitByCode]', eventName, targetInstance);
  WEventBus.emit(eventName, {
    targetInstance,
  });
};

WKit.triggerEventToTargetInstance = function (
  targetInstanceName,
  eventName,
  iter = WKit.makeIterator(wemb.mainPageComponent)
) {
  fx.go(
    fx.range(1),
    (_) => WKit.getInstanceByName(targetInstanceName, iter),
    fx.curry(WKit.emitEvent)(eventName)
  );
};

/* Public API: event bus on / off */
WKit.onEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.map(([eventName, handler]) => WEventBus.on(eventName, handler))
  );
};

WKit.offEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.map(([eventName, handler]) => WEventBus.off(eventName, handler))
  );
};

/* Public API: schema utility  */
WKit.getDataMappingSchema = function () {
  return [
    {
      ownerId: 'ownerId',
      visualInstanceList: ['Chart_for_specific_model'],
      datasetInfo: {
        datasetName: 'dummyjson',
        param: {
          dataType: 'carts',
          id: 'ownerId',
        },
      },
    },
  ];
};

WKit.getGlobalMappingSchema = function () {
  return [
    {
      topic: 'users',
      datasetInfo: {
        datasetName: 'dummyjson',
        param: { dataType: 'users', id: 'default' },
      },
    },
    {
      topic: 'comments',
      datasetInfo: {
        datasetName: 'dummyjson',
        param: { dataType: 'comments', id: 'default' },
      },
    },
  ];
};

WKit.getCustomEventsSchema = function () {
  return {
    click: {
      '.navbar-brand': '@triggerNavbarTitle',
      '.nav-link': '@triggerNavLink',
      '.dropdown-item': '@triggerDropDownItem',
    },
    submit: {
      form: '@submitForm',
    },
  };
};

WKit.getCustomEventsSchemaFor3D = function () {
  return {
    click: '@triggerClick',
  };
};

WKit.getSubscriptionSchema = function () {
  return {
    users: ['method1', 'method2'],
    comments: ['method3', 'method4'],
  };
};

/*Internal only: utils for data mapping */
async function getDataFromMapping({
  ownerId,
  visualInstanceList,
  datasetInfo: { datasetName, param },
}) {
  return {
    ownerId,
    visualInstanceList: fx.map(
      (visualInstanceName) => WKit.getInstanceByName(visualInstanceName, WKit.makeIterator(this)),
      visualInstanceList
    ),
    data: await WKit.fetchData(this, datasetName, param).catch((err) => (console.error(err), [])),
  };
}

function resolveMappingInfo(targetInstance) {
  let dataMapping = [];

  if (!dataMapping.length && targetInstance.dataMapping) {
    dataMapping = targetInstance.dataMapping;
    console.info('[Fallback] instance.dataMapping 사용됨');
  }

  if (!dataMapping.length) {
    throw new Error(`매핑 정보가 없습니다. instanceId: ${targetInstance.id}`);
  }

  return dataMapping;
}

/*Internal only: utils for 2D event */

function makeHandler(targetInstance, selector) {
  return function (event) {
    event.preventDefault();
    const { customEvents } = targetInstance;
    const triggerEvent = customEvents?.[event.type]?.[selector];
    if (triggerEvent) {
      console.log('@eventHandler', customEvents[event.type][selector]);
      WEventBus.emit(triggerEvent, {
        event,
        targetInstance,
      });
    }
  };
}

/*Internal only: utils for 3D */

function makeRaycastingFn(rootElement, raycaster, mouse, scene, camera) {
  return function (event) {
    mouse.x = (event.offsetX / rootElement.clientWidth) * 2 - 1;
    mouse.y = -(event.offsetY / rootElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    fx.go(
      intersects,
      fx.L.map((inter) => inter.object),
      fx.L.map((obj) => {
        let current = obj;
        while (current && !current.eventListener) {
          current = current.parent;
        }
        return current;
      }),
      fx.L.filter(Boolean),
      fx.take(1),
      ([target]) => target?.eventListener?.[event.type]?.(Object.assign(event, { intersects }))
    );
  };
}

function make3DHandler(targetInstance) {
  return function (event) {
    const { customEvents } = targetInstance;
    console.log('@eventHandler', customEvents[event.type]);
    WEventBus.emit(customEvents[event.type], {
      event,
      targetInstance,
    });
  };
}

function disposeMaterial(material) {
  // dispose texture in known slots
  const slots = [
    'map',
    'lightMap',
    'aoMap',
    'emissiveMap',
    'bumpMap',
    'normalMap',
    'displacementMap',
    'roughnessMap',
    'metalnessMap',
    'alphaMap',
    'envMap',
    'specularMap',
    'gradientMap',
  ];

  slots.forEach((key) => {
    const tex = material[key];
    if (tex && tex.dispose) {
      tex.dispose();
      material[key] = null;
    }
  });

  material.dispose?.();
}

/*Internal only: utils for general */
function* combineIterators(iterables) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}

function qsAll(selector, scope = document) {
  if (!selector) throw 'no selector';

  return Array.from(scope.querySelectorAll(selector));
}

function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    const potentialElements = qsAll(selector, instance.element);
    for (const potentialElement of potentialElements) {
      if (potentialElement === event.target) {
        return handler.call(event.target, event);
      }
    }
  };

  instance.userHandlerList = instance.userHandlerList || {};
  instance.userHandlerList[eventName] = instance.userHandlerList[eventName] || {};
  instance.userHandlerList[eventName][selector] = emitEvent;

  instance.element.addEventListener(eventName, emitEvent);
}
