const WKit = {};

/* Public API: 2D event binding */
WKit.bindEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = makeHandler(instance, selector);
        delegate(instance, eventName, selector, handler);
      }, Object.keys(selectorList));
    })
  );
};

WKit.removeCustomEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
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
  fx.each((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};

/* Public API: 3D dispose */
WKit.dispose3DTree = function (rootContainer) {
  if (!rootContainer) return;

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

WKit.disposeAllThreeResources = function (page) {
  const { scene } = wemb.threeElements;
  const { unsubscribe } = GlobalDataPublisher;

  fx.go(
    WKit.makeIterator(page, 'threeLayer'),
    fx.each((instance) => {
      // 1. Subscription 정리 (있는 경우)
      if (instance.subscriptions) {
        fx.go(
          Object.keys(instance.subscriptions),
          fx.each((topic) => unsubscribe(topic, instance))
        );
        instance.subscriptions = null;
      }

      // 2. Event 참조 정리
      instance.customEvents = null;
      instance.datasetInfo = null;

      // 3. 3D 리소스 정리
      if (instance.appendElement) {
        WKit.dispose3DTree(instance.appendElement);
      }
    })
  );

  WKit.clearSceneBackground(scene);
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

WKit.withSelector = function (element, selector, fn) {
  if (!element) return null;

  const target = element.querySelector(selector);
  return target ? fn(target) : null;
};

/* Public API: event bus on / off */
WKit.onEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => WEventBus.on(eventName, handler))
  );
};

WKit.offEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => WEventBus.off(eventName, handler))
  );
};

/* Public API: schema utility  */
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

/*Internal only: utils for 2D event */

function makeHandler(targetInstance, selector) {
  return function (event) {
    // submit만 새로고침 방지, 나머지는 사용자가 핸들러에서 직접 호출
    event.type === 'submit' && event.preventDefault();

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

function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    // Use closest to handle bubbling from child elements
    const target = event.target.closest(selector);

    // Ensure target exists and is within instance.element
    if (target && instance.element.contains(target)) {
      return handler.call(target, event);
    }
  };

  instance.userHandlerList = instance.userHandlerList || {};
  instance.userHandlerList[eventName] = instance.userHandlerList[eventName] || {};
  instance.userHandlerList[eventName][selector] = emitEvent;

  instance.element.addEventListener(eventName, emitEvent);
}
