const navigation = document.querySelector('[data-navigation]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileLayout = window.matchMedia('(max-width: 720px)');
const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
const sections = sectionLinks.map((link) => document.getElementById(link.hash.slice(1)));

function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  navigation.toggleAttribute('data-open', open);
}

function markSection(section) {
  for (const link of sectionLinks) {
    if (link.hash === '#' + section.id) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

menuToggle.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.hasAttribute('data-open')) {
    setMenu(false);
    menuToggle.focus();
  }
});

sectionLinks.forEach((link, index) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const section = sections[index];
    markSection(section);
    if (navigation.hasAttribute('data-open')) {
      setMenu(false);
      // The default anchor action updates the hash and scrolls. Move focus out
      // of the collapsed navigation without applying another scroll.
      section.tabIndex = -1;
      section.focus({ preventScroll: true });
    }
  });
});

function markHashTarget() {
  const target = sections.find((section) => '#' + section.id === window.location.hash);
  if (target) markSection(target);
}

window.addEventListener('hashchange', markHashTarget);

let sectionObserver;
let pendingResize;

function atPageEnd() {
  const { clientHeight, scrollHeight } = document.documentElement;
  return scrollHeight > clientHeight && window.scrollY + clientHeight >= scrollHeight - 2;
}

function observeSections() {
  sectionObserver?.disconnect();
  const viewportHeight = document.documentElement.clientHeight;
  const marker = Math.round(viewportHeight * 0.4);
  sectionObserver = new IntersectionObserver((entries) => {
    if (atPageEnd()) {
      markSection(sections.at(-1));
      return;
    }
    const entry = entries.find(({ isIntersecting }) => isIntersecting);
    if (entry) markSection(entry.target);
  }, {
    rootMargin: '-' + marker + 'px 0px -' + Math.max(0, viewportHeight - marker - 1) + 'px 0px'
  });
  sections.forEach((section) => sectionObserver.observe(section));
}

observeSections();
markHashTarget();

window.addEventListener('scroll', () => {
  if (atPageEnd()) markSection(sections.at(-1));
}, { passive: true });

window.addEventListener('resize', () => {
  cancelAnimationFrame(pendingResize);
  pendingResize = requestAnimationFrame(observeSections);
});

const routeList = document.querySelector('[data-route-list]');
const routeTabs = [...routeList.querySelectorAll('[data-route-tab]')];
const routePanels = routeTabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
const routeCount = document.querySelector('[data-route-count]');
let activeRoute = routeTabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');

function showRoute(index) {
  activeRoute = (index + routeTabs.length) % routeTabs.length;
  routeTabs.forEach((tab, position) => {
    const current = activeRoute === position;
    tab.setAttribute('aria-selected', String(current));
    tab.tabIndex = current ? 0 : -1;
    routePanels[position].hidden = !current;
  });
  routeCount.textContent = String(activeRoute + 1).padStart(2, '0')
    + ' / ' + String(routeTabs.length).padStart(2, '0');
}

function updateLayout() {
  if (!mobileLayout.matches && navigation.hasAttribute('data-open')) {
    const returnFocus = document.activeElement === menuToggle;
    setMenu(false);
    if (returnFocus) navigation.querySelector('[aria-current]')?.focus();
  }
}

mobileLayout.addEventListener('change', updateLayout);
updateLayout();

routeTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showRoute(index));

  tab.addEventListener('keydown', (event) => {
    let next = index;
    switch (event.key) {
      case 'ArrowLeft':
        next -= 1;
        break;
      case 'ArrowRight':
        next += 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = routeTabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    showRoute(next);
    routeTabs[activeRoute].focus();
  });
});

for (const control of document.querySelectorAll('[data-route-step]')) {
  control.addEventListener('click', () => showRoute(activeRoute + Number(control.dataset.routeStep)));
}

const passDialog = document.getElementById('test-dialog');
const savePass = passDialog.querySelector('[data-save-pass]');
const passStatus = passDialog.querySelector('[data-test-status]');
const passStorageKey = 'tian.refraction-routes.demo-pass';
let lastDialogTrigger;
let collected = false;
let localStorageAvailable = true;

try {
  collected = window.localStorage.getItem(passStorageKey) === '1';
} catch {
  localStorageAvailable = false;
}

function updatePass() {
  savePass.textContent = collected ? '移除演示通行证' : '保存演示通行证';
  if (collected) {
    passStatus.dataset.state = localStorageAvailable ? 'saved' : 'temporary';
    passStatus.textContent = localStorageAvailable
      ? '演示通行证已保存至当前浏览器。'
      : '演示通行证已领取，仅在当前页面有效。';
  }
}

updatePass();

for (const trigger of document.querySelectorAll('[data-open-test]')) {
  trigger.addEventListener('click', () => {
    if (passDialog.open) return;
    lastDialogTrigger = trigger;
    if (navigation.contains(trigger)) setMenu(false);
    passDialog.showModal();
  });
}

passDialog.addEventListener('close', () => {
  if (lastDialogTrigger?.getClientRects().length) {
    lastDialogTrigger.focus({ preventScroll: true });
  } else if (mobileLayout.matches) {
    menuToggle.focus({ preventScroll: true });
  } else {
    document.querySelector('.header-action').focus({ preventScroll: true });
  }
});

savePass.addEventListener('click', () => {
  if (savePass.getAttribute('aria-disabled') === 'true') return;
  savePass.setAttribute('aria-busy', 'true');
  savePass.setAttribute('aria-disabled', 'true');
  delete passStatus.dataset.state;
  passStatus.textContent = collected ? '正在移除演示通行证…' : '正在保存演示通行证…';

  window.setTimeout(() => {
    collected = !collected;
    if (localStorageAvailable) {
      try {
        if (collected) {
          window.localStorage.setItem(passStorageKey, '1');
        } else {
          window.localStorage.removeItem(passStorageKey);
        }
      } catch {
        localStorageAvailable = false;
      }
    }
    savePass.removeAttribute('aria-disabled');
    savePass.removeAttribute('aria-busy');
    updatePass();
    if (!collected) passStatus.textContent = '演示通行证已移除。';
  }, 360);
});

const newsFilters = [...document.querySelectorAll('[data-news-filter]')];
const newsArticles = [...document.querySelectorAll('[data-news-type]')];
const newsStatus = document.querySelector('[data-news-status]');

newsFilters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const selection = filter.dataset.newsFilter;
    let visibleCount = 0;
    newsFilters.forEach((button) => button.setAttribute('aria-pressed', String(filter === button)));
    for (const article of newsArticles) {
      article.hidden = selection !== 'all' && article.dataset.newsType !== selection;
      if (!article.hidden) visibleCount += 1;
    }
    newsStatus.textContent = '当前显示 ' + visibleCount + ' 条日志。';
  });
});

const filmTrigger = document.querySelector('[data-open-film]');
const filmDialog = document.getElementById('film-dialog');
const film = filmDialog.querySelector('video');
const filmStatus = filmDialog.querySelector('[role="status"]');

filmTrigger.addEventListener('click', () => {
  filmDialog.showModal();
  film.play().catch(() => {
    if (!filmDialog.open) return;
    filmStatus.textContent = film.error
      ? '影像暂时无法读取，可先查看封面。'
      : '可使用播放器的播放键启动影像。';
  });
});

film.addEventListener('playing', () => { filmStatus.textContent = ''; });
film.addEventListener('error', () => {
  if (filmDialog.open) filmStatus.textContent = '影像暂时无法读取，可先查看封面。';
});

filmDialog.addEventListener('close', () => {
  film.pause();
  filmStatus.textContent = '';
  filmTrigger.focus({ preventScroll: true });
});
