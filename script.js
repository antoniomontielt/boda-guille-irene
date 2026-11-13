const CONFIG = {
  WEDDING_DATE: '2027-06-05T00:00:00',
  GOOGLE_SHEET: {
    ID: '1-3TiGddxDZIjVNgPjH-7DcMIhxMxcosA1WrwLUJuRAs',
    RSVP_SHEET_NAME: 'RSVP',
    BUS_SHEET_NAME: 'BUS',
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz2PZ0sWMh-ZwSNkTieG2kJkJERxlDIb_66oD5YlSkGRv62WIrnJYuO5Z29oD6ocNw/exec'
  },
  VALIDATION: {
    PATTERNS: {
      email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
      phone: /^[6-9]\d{8}$/,
      name: /^[a-zA-ZÀ-ÿ\s]{2,50}$/
    },
    ERROR_MESSAGES: {
      required: 'Este campo es obligatorio',
      email: 'Por favor, introduce un email válido',
      phone: 'Introduce un número de teléfono válido (9 dígitos)',
      name: 'El nombre debe contener entre 2 y 50 caracteres',
      select: 'Por favor, selecciona una opción'
    }
  },
  CHAT: {
    QA_MAP: {
      '¿Dónde es la ceremonia?': 'La ceremonia se celebrará en los jardines de la Hacienda Real Los Olivos.',
      '¿A qué hora hay que estar allí?': 'Te recomendamos llegar al menos 30 minutos antes de la ceremonia, que comenzará a las 19:30 horas.',
      '¿A qué hora empieza la ceremonia?': 'La ceremonia comenzará a las 19:30 horas.',
      '¿A qué hora empieza el cóctel?': 'El cóctel empezará sobre las 21:00 horas, justo después de la ceremonia.',
      '¿Dónde puedo aparcar?': 'El hotel cuenta con parking privado para los invitados.',
      '¿Hay servicio de autobús?': 'Sí, habrá un servicio de autobús que saldrá desde la ciudad hasta el lugar de la celebración. Será un servicio de ida y vuelta. Puedes reservar tu plaza en el formulario de nuestra web. Te pedimos que lo hagas antes del 10 de agosto. Las plazas son limitadas.',
      '¿Dónde puedo alojarme?': 'La Hacienda Real Los Olivos es un hotel pequeño por lo que las habitaciones son pocas, si están ya completas habla con los novios para que ellos te orienten.',
      '¿Cómo puedo confirmar mi asistencia?': 'Puedes confirmar tu asistencia a través del formulario RSVP en nuestra web. Te pedimos que lo hagas antes del 10 de agosto.',
      '¿Qué código de vestimenta hay?': 'Ninguno; salvo, de forma obvia, no ir de blanco.',
      '¿Puedo llevar niños?': 'Por supuesto, los niños son bienvenidos. Hemos preparado una zona especial para ellos con actividades y entretenimiento.',
      '¿Qué tipo de regalo puedo hacer?': 'Tu presencia es nuestro mejor regalo, pero si deseas hacer un detalle, hemos habilitado un número de cuenta bancaria para contribuciones a nuestra luna de miel. Puedes encontrar el número de cuenta en la sección "Regalos" de nuestra web.',
      '¿Cómo puedo sugerir canciones para la boda?': 'Puedes sugerir canciones para la boda a través de la sección de música en nuestra web. Nos encantaría conocer tus preferencias musicales.',
      '¿Se pueden compartir fotos de la boda?': 'Sí, nos encantaría que compartieras tus fotos de la boda. Puedes subirlas a nuestra galería en la sección "Galería" de nuestra web.'
    }
  }
};

// =============================================
// FUNCIONES UTILITARIAS
// =============================================

/**
 * Muestra un mensaje toast en la pantalla
  @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success, error, info)
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
}

/**
 * Valida un campo de formulario según sus reglas
 * @param {HTMLElement} field - Elemento del campo a validar
 * @returns {boolean} - True si el campo es válido
 */
function validateField(field) {
  const value = field.value.trim();
  const errorElement = field.parentElement.querySelector('.error-message');
  let isValid = true;
  let errorMessage = '';


  if (field.required && !value) {
    isValid = false;
    errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.required;
  } else if (value) {

    switch (field.type) {
      case 'email':
        if (!CONFIG.VALIDATION.PATTERNS.email.test(value)) {
          isValid = false;
          errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.email;
        }
        break;
      case 'tel':
        if (!CONFIG.VALIDATION.PATTERNS.phone.test(value)) {
          isValid = false;
          errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.phone;
        }
        break;
      case 'text':
        if (field.id.includes('name') && !CONFIG.VALIDATION.PATTERNS.name.test(value)) {
          isValid = false;
          errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.name;
        }
        break;
    }

  
    if (field.tagName === 'SELECT' && value === '') {
      isValid = false;
      errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.select;
    }
  }


  if (!isValid) {
    field.classList.add('invalid');
    errorElement.textContent = errorMessage;
    errorElement.classList.add('show');
  } else {
    field.classList.remove('invalid');
    errorElement.classList.remove('show');
  }

  return isValid;
}

/**
 * 
 * @param {HTMLFormElement} form  
 * @returns {boolean} 
 */
function validateForm(form) {
  const fields = form.querySelectorAll('input, select, textarea');
  let isValid = true;

  fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * 
 * @param {Object} formData
 * @param {string} sheetName 
 * @returns {Promise<Object>}
 */
async function submitToGoogleSheet(formData, sheetName) {
  try {
    const response = await fetch(CONFIG.GOOGLE_SHEET.SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        action: 'submit',
        sheetName: sheetName,
        data: formData
      })
    });
    
    if (response.type === 'opaque') {
      return { status: 'success', message: 'Datos enviados correctamente' };
    }

    throw new Error(`Error en la respuesta del servidor: ${response.status}`);
  } catch (error) {
    throw new Error(`Error al conectar con Google Sheets: ${error.message}`);
  }
}



const CountdownModule = (() => {
 
  function update() {
    const weddingDate = new Date(CONFIG.WEDDING_DATE);
    const now = new Date();
    const difference = weddingDate - now;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    updateValue('days', days);
    updateValue('hours', hours);
    updateValue('minutes', minutes);
    updateValue('seconds', seconds);
  }

  /**
   * 
   * @param {string} id
   * @param {number} value
   */
  function updateValue(id, value) {
    const element = document.getElementById(id);
    const currentValue = parseInt(element.textContent);
    
    if (currentValue !== value) {
      element.classList.add('updating');
      setTimeout(() => {
        element.textContent = String(value).padStart(2, '0');
        element.classList.remove('updating');
      }, 150);
    }
  }

  
  function init() {
    setTimeout(() => {
      update();
      setInterval(update, 1000);
    }, 1000);
  }

  return { init };
})();

const ChatModule = (() => {
  let answeredQuestions = new Set();
  const elements = {
    chatToggle: document.getElementById('chat-toggle'),
    chatBox: document.getElementById('chat-box'),
    closeChat: document.getElementById('close-chat'),
    chatMessages: document.getElementById('chat-messages'),
    questionsContainer: document.querySelector('.predefined-questions')
  };

 
  function show() {
    elements.chatBox.classList.add('visible');
    document.querySelector('.chat-overlay').classList.add('visible');
  }

  
  function hide() {
    elements.chatBox.classList.remove('visible');
    document.querySelector('.chat-overlay').classList.remove('visible');
  }

 
  function showAvailableQuestions() {
    elements.questionsContainer.innerHTML = '';
    
    Object.keys(CONFIG.CHAT.QA_MAP).forEach(question => {
      if (!answeredQuestions.has(question)) {
        const button = document.createElement('button');
        button.className = 'question-btn';
        button.textContent = question;
        button.addEventListener('click', () => handleQuestionClick(question));
        elements.questionsContainer.appendChild(button);
      }
    });
  }

  /**
   * 
   * @param {string} question
   */
  function handleQuestionClick(question) {
    const answer = CONFIG.CHAT.QA_MAP[question];
    
    
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = question;
    elements.chatMessages.appendChild(userMessage);
    
    
    const typingMessage = document.createElement('div');
    typingMessage.className = 'message bot typing';
    elements.chatMessages.appendChild(typingMessage);
    
    
    setTimeout(() => {
      elements.chatMessages.removeChild(typingMessage);
      const botMessage = document.createElement('div');
      botMessage.className = 'message bot';
      botMessage.textContent = answer;
      elements.chatMessages.appendChild(botMessage);
      
      answeredQuestions.add(question);
      showRemainingQuestions();
    }, 1000);
  }

  /**
   * 
   */
  function showRemainingQuestions() {
    const remainingQuestionsContainer = document.createElement('div');
    remainingQuestionsContainer.className = 'remaining-questions';
    
    const showAllButton = document.createElement('button');
    showAllButton.className = 'question-btn show-all-btn';
    showAllButton.textContent = 'Ver todas las preguntas';
    showAllButton.addEventListener('click', () => {
      answeredQuestions.clear();
      showAvailableQuestions();
    });
    remainingQuestionsContainer.appendChild(showAllButton);
    
    Object.keys(CONFIG.CHAT.QA_MAP).forEach(q => {
      if (!answeredQuestions.has(q)) {
        const button = document.createElement('button');
        button.className = 'question-btn';
        button.textContent = q;
        button.addEventListener('click', () => handleQuestionClick(q));
        remainingQuestionsContainer.appendChild(button);
      }
    });
    
    elements.chatMessages.appendChild(remainingQuestionsContainer);
    
    setTimeout(() => {
      const botMessageHeight = elements.chatMessages.lastElementChild.previousElementSibling.offsetHeight;
      const remainingQuestionsHeight = remainingQuestionsContainer.offsetHeight;
      const visibleHeight = elements.chatMessages.clientHeight;
      const scrollPosition = elements.chatMessages.scrollHeight - visibleHeight - (remainingQuestionsHeight * 0.7);
      
      elements.chatMessages.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }, 100);
  }

 
  function init() {
   
    const overlay = document.createElement('div');
    overlay.className = 'chat-overlay';
    document.body.appendChild(overlay);

    
    elements.chatToggle.addEventListener('click', show);
    elements.closeChat.addEventListener('click', hide);
    overlay.addEventListener('click', hide);
    
    showAvailableQuestions();
  }

  return { init };
})();

const GalleryModule = (() => {
  const elements = {
    main: document.querySelector('.gallery-main img'),
    thumbnails: document.querySelectorAll('.gallery-thumbnails img'),
    prevButton: document.querySelector('.gallery-prev'),
    nextButton: document.querySelector('.gallery-next')
  };
  let currentIndex = 0;

  /**
   * 
   * @param {number} index
   */
  function update(index) {
    elements.main.src = elements.thumbnails[index].src;
    elements.main.alt = elements.thumbnails[index].alt;
    
    elements.thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
    
    currentIndex = index;
  }

 
  function init() {
    elements.thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', () => update(index));
    });

    elements.prevButton.addEventListener('click', () => {
      const newIndex = (currentIndex - 1 + elements.thumbnails.length) % elements.thumbnails.length;
      update(newIndex);
    });

    elements.nextButton.addEventListener('click', () => {
      const newIndex = (currentIndex + 1) % elements.thumbnails.length;
      update(newIndex);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        elements.prevButton.click();
      } else if (e.key === 'ArrowRight') {
        elements.nextButton.click();
      }
    });

   
    elements.thumbnails.forEach(thumb => {
      thumb.addEventListener('mouseenter', () => {
        thumb.style.opacity = '0.8';
      });
      thumb.addEventListener('mouseleave', () => {
        thumb.style.opacity = '0.6';
      });
    });
  }

  return { init };
})();

const StoryCarouselModule = (() => {
  const elements = {
    moments: document.querySelectorAll('.story-moment'),
    dots: document.querySelectorAll('.story-dots .dot'),
    prevBtn: document.querySelector('.story-prev'),
    nextBtn: document.querySelector('.story-next'),
    nav: document.querySelector('.story-navigation')
  };
  let currentIndex = 0;

  /**
   * 
   * @param {number} index
   */
  function showMoment(index) {
    elements.moments.forEach((moment, i) => {
      moment.classList.toggle('active', i === index);
    });
    elements.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentIndex = index;
    relocateNavigation();
  }

 
  function relocateNavigation() {
    const isMobile = window.innerWidth <= 768;
    const activeMoment = document.querySelector('.story-moment.active');

    if (isMobile && activeMoment && elements.nav) {
      const alreadyInside = activeMoment.contains(elements.nav);
      if (!alreadyInside) {
        activeMoment.querySelector('.story-image')?.after(elements.nav);
      }
    } else {
      const container = document.querySelector('#our-story .container');
      const existingNav = container.querySelector('.story-navigation');
      if (!container.contains(existingNav)) {
        container.appendChild(elements.nav);
      }
    }
  }

 
  function handleSwipe() {
    let touchStartX = 0;
    let touchEndX = 0;

    const storySection = document.querySelector('#our-story');

    storySection.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    storySection.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      
      if (touchEndX < touchStartX - 50) {
        const newIndex = (currentIndex + 1) % elements.moments.length;
        showMoment(newIndex);
      }
      if (touchEndX > touchStartX + 50) {
        const newIndex = (currentIndex - 1 + elements.moments.length) % elements.moments.length;
        showMoment(newIndex);
      }
    });
  }

 
  function init() {
    elements.prevBtn.addEventListener('click', () => {
      const newIndex = (currentIndex - 1 + elements.moments.length) % elements.moments.length;
      showMoment(newIndex);
    });

    elements.nextBtn.addEventListener('click', () => {
      const newIndex = (currentIndex + 1) % elements.moments.length;
      showMoment(newIndex);
    });

    elements.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => showMoment(i));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        showMoment(currentIndex);
      } else if (e.key === 'ArrowRight' && currentIndex < elements.moments.length - 1) {
        currentIndex++;
        showMoment(currentIndex);
      }
    });

    handleSwipe();
    showMoment(0);
  }

  return { init };
})();


const FormModule = (() => {


    const elements = {
        rsvpForm: document.getElementById('rsvp-form'),
        busForm: document.getElementById('bus-form'),
        adultsInput: document.getElementById('rsvp-adults'),
        childrenInput: document.getElementById('rsvp-children'),
        attendeesContainer: document.getElementById('attendees-container'),
        attendeesError: document.querySelector('.attendees-error')
    };

    const MAX_ATTENDEES = 20;

    const MENU_OPTIONS = [
        { value: 'normal', label: 'Menú Normal' },
        { value: 'vegetariano', label: 'Menú Vegetariano' },
        { value: 'vegano', label: 'Menú Vegano' }
    ];



    function updateCounter(type, action) {

        const input = type === 'adults'
            ? elements.adultsInput
            : elements.childrenInput;

        if (!input) return;

        let value = parseInt(input.value, 10) || 0;

        if (action === 'increase' && value < MAX_ATTENDEES) {
            value++;
        }

        if (action === 'decrease' && value > 0) {
            value--;
        }

        input.value = value;

        updateAttendees();

    }


  
    function getCurrentAttendees() {

        const attendees = {};

        if (!elements.attendeesContainer) return attendees;

        const groups = elements.attendeesContainer.querySelectorAll(
            '[data-attendee-type][data-attendee-number]'
        );

        groups.forEach(group => {

            const type = group.dataset.attendeeType;
            const number = group.dataset.attendeeNumber;
            const key = `${type}-${number}`;

            attendees[key] = {
                name: group.querySelector('[data-field="name"]')?.value || '',
                menu: group.querySelector('[data-field="menu"]')?.value || '',
                allergies: group.querySelector('[data-field="allergies"]')?.value || ''
            };

        });

        return attendees;
    }




    function createAttendeeHTML(type, number, data = {}) {

        const title = type === 'adult' ? 'Adulto' : 'Niño';

        const index = type === 'adult'
            ? number - 1
            : parseInt(elements.adultsInput.value, 10) + number - 1;

        const options = MENU_OPTIONS.map(option => `
            <option
                value="${option.value}"
                ${data.menu === option.value ? 'selected' : ''}
            >
                ${option.label}
            </option>
        `).join('');

        return `
            <div data-attendee-type="${type}" data-attendee-number="${number}">

                <h4>${title} ${number}</h4>

                <div class="form-group">
                    <input
                        type="text"
                        id="rsvp-attendee-${type}-${number}-name"
                        name="attendees[${index}][name]"
                        data-field="name"
                        value="${escapeHTML(data.name || '')}"
                        placeholder="Nombre y apellidos"
                        required
                    >
                    <div class="error-message"></div>
                </div>

                <div class="form-group">
                    <select
                        id="rsvp-attendee-${type}-${number}-menu"
                        name="attendees[${index}][menu]"
                        data-field="menu"
                        required
                    >
                        <option value="">Tipo de Menú</option>
                        ${options}
                    </select>
                    <div class="error-message"></div>
                </div>

                <div class="form-group">
                    <textarea
                        id="rsvp-attendee-${type}-${number}-allergies"
                        name="attendees[${index}][allergies]"
                        data-field="allergies"
                        placeholder="Alergias o Intolerancias"
                    >${escapeHTML(data.allergies || '')}</textarea>
                    <div class="error-message"></div>
                </div>

            </div>
        `;
    }


  

    function updateAttendees() {

        if (!elements.attendeesContainer) return;

        // Guardar los datos introducidos antes de regenerar
        const previousData = getCurrentAttendees();

        const adults = parseInt(elements.adultsInput.value, 10) || 0;
        const children = parseInt(elements.childrenInput.value, 10) || 0;

        let html = '';

       
        for (let i = 1; i <= adults; i++) {

            const key = `adult-${i}`;

            html += createAttendeeHTML(
                'adult',
                i,
                previousData[key] || {}
            );

        }

     
        for (let i = 1; i <= children; i++) {

            const key = `child-${i}`;

            html += createAttendeeHTML(
                'child',
                i,
                previousData[key] || {}
            );

        }

        elements.attendeesContainer.innerHTML = html;

       
        if (elements.attendeesError) {
            elements.attendeesError.textContent = '';
            elements.attendeesError.classList.remove('show');
        }

    }


    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


   

    function validateRsvpForm() {

        const form = elements.rsvpForm;

        let isValid = true;

        
        const contactFields = [
            document.getElementById('rsvp-name'),
            document.getElementById('rsvp-email'),
            document.getElementById('rsvp-phone')
        ];

        contactFields.forEach(field => {

            if (!field || !validateField(field)) {
                isValid = false;
            }

        });

        
        const adults = parseInt(elements.adultsInput.value, 10) || 0;
        const children = parseInt(elements.childrenInput.value, 10) || 0;

        if (adults + children === 0) {

            isValid = false;

            if (elements.attendeesError) {
                elements.attendeesError.textContent =
                    'Debes indicar al menos una persona para confirmar la asistencia.';

                elements.attendeesError.classList.add('show');
            }

        }

        
        const attendeeFields = elements.attendeesContainer.querySelectorAll(
            'input[required], select[required]'
        );

        attendeeFields.forEach(field => {

            if (!validateField(field)) {
                isValid = false;
            }

        });

        return isValid;

    }


   

    function collectRsvpData() {
    const attendees = [];

    const groups = elements.attendeesContainer.querySelectorAll(
        '[data-attendee-type][data-attendee-number]'
    );

    groups.forEach(group => {
        attendees.push({
            name: group.querySelector('[data-field="name"]').value.trim(),
            type: group.dataset.attendeeType === 'adult' ? 'Adulto' : 'Niño',
            menu: group.querySelector('[data-field="menu"]').value,
            allergies: group.querySelector('[data-field="allergies"]').value.trim()
        });
    });

    return {
        contactName: document.getElementById('rsvp-name').value.trim(),
        email: document.getElementById('rsvp-email').value.trim(),
        phone: document.getElementById('rsvp-phone').value.trim(),
        adults: parseInt(elements.adultsInput.value, 10),
        children: parseInt(elements.childrenInput.value, 10),
        attendees: attendees,
        timestamp: new Date().toISOString()
    };
}


 

    function showFormMessage(form, type, title, message) {

        
        form.querySelectorAll('.form-success, .form-error').forEach(element => {
            element.remove();
        });

        const messageElement = document.createElement('div');

        messageElement.className = type === 'success'
            ? 'form-success'
            : 'form-error';

        const icon = type === 'success'
            ? 'fa-check-circle'
            : 'fa-exclamation-circle';

        const iconElement = document.createElement('i');
        iconElement.className = `fas ${icon}`;

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;

        const textElement = document.createElement('p');
        textElement.textContent = message;

        messageElement.append(
            iconElement,
            titleElement,
            textElement
        );

        form.appendChild(messageElement);

        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);

    }




    async function handleRsvpSubmit(event) {

        event.preventDefault();

        const form = event.target;
        const submitButton = form.querySelector('.submit-button');

        if (!validateRsvpForm()) return;

        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {

            const formData = collectRsvpData();

            await submitToGoogleSheet(
                formData,
                CONFIG.GOOGLE_SHEET.RSVP_SHEET_NAME
            );

            showFormMessage(
                form,
                'success',
                '¡Gracias!',
                'Tu confirmación de asistencia ha sido enviada. ¡Nos vemos en la boda!'
            );

           
            form.reset();

            elements.adultsInput.value = 1;
            elements.childrenInput.value = 0;

            updateAttendees();

        } catch (error) {

            console.error('Error al enviar RSVP:', error);

            showFormMessage(
                form,
                'error',
                'Error',
                'Hubo un problema al procesar tu confirmación. Por favor, inténtalo de nuevo.'
            );

        } finally {

            submitButton.classList.remove('loading');
            submitButton.disabled = false;

        }

    }


   

    async function handleBusSubmit(event) {

        event.preventDefault();

        const form = event.target;
        const submitButton = form.querySelector('.submit-button');

        if (!validateForm(form)) return;

        submitButton.classList.add('loading');
        submitButton.disabled = true;

        try {

            const formData = {
                name: document.getElementById('bus-name').value.trim(),
                email: document.getElementById('bus-email').value.trim(),
                phone: document.getElementById('bus-phone').value.trim(),
                timestamp: new Date().toISOString()
            };

            await submitToGoogleSheet(
                formData,
                CONFIG.GOOGLE_SHEET.BUS_SHEET_NAME
            );

            showFormMessage(
                form,
                'success',
                '¡Gracias!',
                'Tu solicitud de reserva ha sido enviada correctamente.'
            );

            form.reset();

        } catch (error) {

            console.error('Error al enviar formulario de autobús:', error);

            showFormMessage(
                form,
                'error',
                'Error',
                'Hubo un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.'
            );

        } finally {

            submitButton.classList.remove('loading');
            submitButton.disabled = false;

        }

    }


   

    function init() {

        
        if (elements.rsvpForm) {

           
            updateAttendees();

           
            elements.rsvpForm.addEventListener('click', event => {

                const button = event.target.closest(
                    '[data-counter][data-action]'
                );

                if (!button) return;

                updateCounter(
                    button.dataset.counter,
                    button.dataset.action
                );

            });

            
            elements.rsvpForm.addEventListener(
                'submit',
                handleRsvpSubmit
            );

        }

        
        if (elements.busForm) {

            elements.busForm.addEventListener(
                'submit',
                handleBusSubmit
            );

        }

    }


    return { init };

})();


const NavigationModule = (() => {
  
  function handleScroll() {
    const currentScroll = window.pageYOffset;
    const mainNav = document.querySelector('.main-nav');
    
    if (currentScroll > 100) {
      mainNav.classList.add('visible');
    } else {
      mainNav.classList.remove('visible');
    }
  }

  
  function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');
    
    if (!hamburger || !navLinks) return;
    
    hamburger.addEventListener('click', function() {
      this.classList.toggle('active');
      navLinks.classList.toggle('active');
      
      if (navLinks.classList.contains('active')) {
        navItems.forEach((item, index) => {
          item.style.transitionDelay = `${index * 0.1 + 0.3}s`;
        });
      } else {
        navItems.forEach(item => {
          item.style.transitionDelay = '0s';
        });
      }
    });
    
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navItems.forEach(item => {
          item.style.transitionDelay = '0s';
        });
      });
    });
  }

  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

 
  function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;
    
    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  
  function init() {
    initHamburgerMenu();
    initSmoothScroll();
    initBackToTop();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('load', handleScroll);
  }

  return { init };
})();

const ParallaxModule = (() => {
  
  function handleParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const currentScrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;
    
    if (currentScrollY < heroHeight) {
      const scrolled = currentScrollY / heroHeight;
      hero.style.backgroundPositionY = `calc(50% + ${scrolled * 20}px)`;
    }
  }

  
  function init() {
    window.addEventListener('scroll', handleParallax);
    window.addEventListener('resize', handleParallax);
  }

  return { init };
})();

const TimelineModule = (() => {

  function init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    });

    document.querySelectorAll('.timeline-item').forEach(item => {
      observer.observe(item);
    });
  }

  return { init };
})();

const MicroInteractionsModule = (() => {
 
  function init() {
    
    const buttons = document.querySelectorAll('.submit-button, .booking-button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'none';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'none';
      });
    });

    
    const cards = document.querySelectorAll('.timeline-item, .venue-details, .venue-map, .venue-gallery, .hotel-booking');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        card.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.backgroundColor = 'white';
        card.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      });
    });

    
    const icons = document.querySelectorAll('.timeline-icon, .venue-info i, .booking-notes i');
    icons.forEach(icon => {
      icon.addEventListener('mouseenter', () => {
        icon.style.transform = 'scale(1.2)';
        icon.style.color = 'var(--accent-color)';
      });
      icon.addEventListener('mouseleave', () => {
        icon.style.transform = 'scale(1)';
        icon.style.color = '';
      });
    });

    
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      backToTop.addEventListener('mouseenter', () => {
        backToTop.style.transform = 'translateY(-5px) rotate(360deg)';
      });
      backToTop.addEventListener('mouseleave', () => {
        backToTop.style.transform = 'translateY(0) rotate(0)';
      });
    }

    
    const chatToggle = document.getElementById('chat-toggle');
    if (chatToggle) {
      chatToggle.addEventListener('mouseenter', () => {
        chatToggle.style.transform = 'scale(1.1) rotate(5deg)';
      });
      chatToggle.addEventListener('mouseleave', () => {
        chatToggle.style.transform = 'scale(1) rotate(0)';
      });
    }

    
    const copyButton = document.querySelector('.account-number i');
    if (copyButton) {
      copyButton.addEventListener('mouseenter', () => {
        copyButton.style.transform = 'scale(1.2)';
      });
      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.transform = 'scale(1)';
      });
    }
  }

  return { init };
})();

const AccountModule = (() => {
  
  function copyAccountNumber() {
    const accountNumber = document.querySelector('.account-number').textContent.trim();
    const icon = document.querySelector('.account-number i');
    
    navigator.clipboard.writeText(accountNumber).then(() => {
      const originalIcon = icon.className;
      icon.className = 'fas fa-check';
      showToast('¡Número copiado!');
      
      setTimeout(() => {
        icon.className = originalIcon;
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar el número de cuenta:', err);
    });
  }

 
  function init() {
    const copyButton = document.querySelector('.account-number i');
    if (copyButton) {
      copyButton.addEventListener('click', copyAccountNumber);
    }
  }

  return { init };
})();



document.addEventListener('DOMContentLoaded', () => {
  CountdownModule.init();
  ChatModule.init();
  GalleryModule.init();
  StoryCarouselModule.init();
  FormModule.init();
  NavigationModule.init();
  ParallaxModule.init();
  TimelineModule.init();
  MicroInteractionsModule.init();
  AccountModule.init();
});