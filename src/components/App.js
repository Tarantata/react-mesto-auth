import React, { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Main from "./Main";
import PopupWithForm from "./PopupWithForm";
import ImagePopup from "./ImagePopup";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import Api from "../utils/Api";
import {Route, Switch, Redirect, useHistory} from 'react-router-dom';
import ProtectedRoute from "./ProtectRoute";
import LogIn from "./LogIn";
import Register from "./Register";
import InfoTooltip from "./InfoTooltip";
import * as Auth from "../utils/Auth";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = React.useState({});
  const [currentUser, setCurrentUser] = React.useState({});
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [tooltipMessage, setTooltipMessage] = React.useState('');
  const [tooltipIsOk, setTooltipIsOk] = React.useState(false);
  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const history = useHistory();

  const handleInfoTooltipOpen =(tooltipMessage, tooltipIsOk) => {
    setIsInfoTooltipOpen(true);
    setTooltipMessage(tooltipMessage);
    setTooltipIsOk(tooltipIsOk);
  };

  // const handleCardClick = (link) => { setSelectedCard(link) };
  // const handleEditProfileClick = () => { setIsEditProfilePopupOpen(true) };
  // const handleAddPlaceClick = () => { setIsAddPlacePopupOpen(true) };
  // const handleEditAvatarClick = () => { setIsEditAvatarPopupOpen(true) };

  /* данные профиля с сервера */
    useEffect(() => {
      if (email) {
        Api
          .getUserInfo()
          .then((data) => {
            setCurrentUser(data);
          })
          .catch(err => console.error(err))
        }
    }, [email]);

  /* массив объектов карточек с сервера */
    useEffect(() => {
      if (email) {
        Api
          .getInitialCards()
          .then((data) => {
            setCards(data);
          })
          .catch(err => console.error(err))
        }
    }, [email]);

  /* отправка карточки на сервер */
    function handleAddPlaceSubmit(cardData) {
      setIsLoading(!isLoading);
      Api
        .createNewCard(cardData)
        .then((data) => {
          setIsLoading(!isLoading);
          setCards([data, ...cards]);
          closeAllPopups();
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        })
    }

  /* отправка данных для лайка карточки */
    function handleCardLike(card) {
      const isLiked = card.likes.some((i) => i._id === currentUser._id);
      Api
        .changeLikeCardStatus(card._id, isLiked)
        .then((newCard) => {
          setCards((state) => state.map((c) => c._id === card._id ? newCard : c));
         })
        .catch(err => console.error(err));
    }

  /* отправка данных для удаления карточки */
    function handleCardDelete(card) {
      setIsLoading(!isLoading);
      Api
        .deleteCard(card._id)
        .then(() => {
          setIsLoading(!isLoading);
          setCards(prevState => prevState.filter((item) => item._id !== card._id));
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }

  /* отправка данных для изменения профиля */
  function handleUpdateUser(userData) {
    setIsLoading(!isLoading);
    Api
      .updateProfile(userData)
      .then((item) => {
        setCurrentUser(item);
        closeAllPopups();
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }

 /* отправка данных для изменения аватара */
  function handleUpdateAvatar(avatarData) {
    // setIsLoading(!isLoading);
    Api
      .getAvatarInfo(avatarData)
      .then((item) => {
        setCurrentUser(item);
        closeAllPopups();
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
    }

  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(!isEditProfilePopupOpen);
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(!isAddPlacePopupOpen);
  }

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(!isEditAvatarPopupOpen);
  }

  function handleCardClick(selectedCard) {
    setIsImagePopupOpen(!isImagePopupOpen);
    setSelectedCard(selectedCard);
    // console.log(selectedCard)
  }

  // async function handleTokenCheck() {

    // const token = localStorage.getItem('token');
    // if (token) {
    //   Auth.checkToken(token)
    //   .then((res) => {
    //     if (res) {
    //       handleLogin(res.data.email);
    //       setIsLoggedIn(true);
    //     }
    //   })
    //       .catch(err => console.error(err));
  //   // }
  //     setIsLoadingPage(false)
  // }

  function handleRegister (email, password) {
    Auth.register(email, password)
      .then((res) => {
        handleInfoTooltipOpen(
          res.error ?
            'Что-то пошло не так. \n Попробуйте ещё раз!' :
            'Вы успешно \n зарегистрировались!', true
            );
      })
      .catch(err => console.error(err));
  }

  const handleAuthorize = React.useCallback(async (email, password) => {
    try {
      const data = await Auth.authorize(email, password);
      if (data.token) {
        localStorage.setItem('token', data.token);
        handleLogin(email);
        setIsLoggedIn(true);
        handleInfoTooltipOpen('Добро пожаловать!', true)
      } else {
        handleInfoTooltipOpen('Неправильный \n логин или пароль', true)
      }
    } catch {} finally {
      setIsLoadingPage(false)
    }
  }, []);

  const handleTokenCheck = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await Auth.checkToken(token);
        // .then(() => {
        if (res) {
          handleLogin(res.data.email);
          setIsLoggedIn(true)
        }
        // })
      }} finally {
      setIsLoadingPage(false)
    }
  }, []);

  React.useEffect( () => {
    handleTokenCheck()
        .catch((err) => console.error(err))
  }, [handleTokenCheck]);

  // function handleAuthorize(email, password) {
  //   Auth.authorize(email, password)
  //     .then ((data) => {
  //       if (data.token) {
  //         localStorage.setItem('token', data.token);
  //         handleLogin(email);
  //         setIsLoggedIn(true);
  //       } else {
  //         handleInfoTooltipOpen('Неправильный \n логин или пароль', false)
  //       }
  //     })
  //     .catch(() => handleInfoTooltipOpen('Что-то пошло не так. /n Попробуйте ещё раз.', false));
  //   setIsLoadingPage(false)
  // }

  function handleLogin(email) {
    setEmail(email);
    history.push('/');
    // Promise.all([Api.getUserInfo(), Api.getInitialCards()])
    //   .then(([users, cards]) => {
    //   setCurrentUser(users);
    //   setCards(cards);
    // })
    // .catch(err => { console.log(err) });
  }

  function handleSignOut() {
    setCards([]);
    setEmail('');
    localStorage.removeItem('token');
  }

  const closeAllPopups = () => {
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsImagePopupOpen(false);
    setSelectedCard({});
    setIsInfoTooltipOpen(false);
  };

  if (isLoadingPage) {
    return (
        <>
          <div className='page__loadingPage'>Loading...</div>
        </>
    )
  }

  return (
    <div className="page">
      <CurrentUserContext.Provider value={currentUser}>
        <Header email={email} onSignOut={handleSignOut} />
        <Switch>
          <ProtectedRoute exact path='/'
                          loggedIn={isLoggedIn}
                          component={Main}
                          onEditProfile={handleEditProfileClick}
                          onAddPlace={handleAddPlaceClick}
                          onEditAvatar={handleEditAvatarClick}
                          onCardClick={handleCardClick}
                          handleCardLike={handleCardLike}
                          handleCardDelete={handleCardDelete}
                          cards={cards}
                          email={email}>
          </ProtectedRoute>

          <Route path="/sign-in">
            <LogIn onAuthorize={handleAuthorize} />
          </Route>

          <Route path="/sign-up">
            <Register onRegister={handleRegister} />
          </Route>

          <Route>
            {isLoggedIn ? <Redirect exact to='/' /> : <Redirect to='/sign-in' />}
          </Route>
        </Switch>

        <InfoTooltip isOpen={isInfoTooltipOpen} tooltipMessage={tooltipMessage} tooltipIsOk={tooltipIsOk} onClose={closeAllPopups} />

        {/* Попап редактирования профиля */}
        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />

        {/* Попап редактирования аватара */}
        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />

        {/* Попап добавления карточки */}
          <AddPlacePopup
            isOpen={isAddPlacePopupOpen}
            onClose={closeAllPopups}
            onAddPlace={handleAddPlaceSubmit}
          />

        {/* Попап удаления карточки */}
        <PopupWithForm name="confirm-form" title="Вы уверены?">
          <button className="popup__button"  type="submit" aria-label="Сохранить изменения">Да</button>
        </PopupWithForm>

        {/* Попап полноразмерной карточки */}
        <ImagePopup card={selectedCard} onClose={closeAllPopups} isOpen={isImagePopupOpen} />

      <Footer />
      </CurrentUserContext.Provider>
    </div>
  );
}

export default App;
