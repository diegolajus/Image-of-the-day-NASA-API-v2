import { useEffect, useState, ChangeEvent } from 'react';
import './App.css';
import './loader.css';
import './datepicker.css';

interface ChosenDay {
  date: string;
  mediaType: string;
  url: string;
  title: string;
  explanation: string;
}

interface Data {
  chosenDay: ChosenDay;
  isLoading: boolean;
  error: string | null;
}

interface ApiResponse {
  code?: number;
  media_type: string;
  url: string;
  title: string;
  explanation: string;
}

function App() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [chosenDay, setChosenDay] = useState<string>('');
  const [data, setData] = useState<Data>({
    chosenDay: {
      date: '',
      mediaType: '',
      url: '',
      title: '',
      explanation: '',
    },
    isLoading: true,
    error: null,
  });
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const NASA_API = import.meta.env.VITE_random_var;

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function fetchData(date: string) {
    setIsDataLoaded(false);

    fetch(`https://api.nasa.gov/planetary/apod?date=${date}&api_key=${NASA_API}`)
      .then<ApiResponse>(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok.');
        }
        return res.json();
      })
      .then(result => {
        setData(prevState => ({
          ...prevState,
          chosenDay: {
            date: formatDate(new Date(date)),
            mediaType: result.media_type,
            url: result.url,
            title: result.title,
            explanation: result.explanation,
          },
          isLoading: false,
          error: null,
        }));
        setIsDataLoaded(true);
      })
      .catch(error => {
        setData(prevState => ({
          ...prevState,
          error: 'Failed to fetch data',
          isLoading: false,
        }));
        setIsDataLoaded(true);
      });
  }

  useEffect(() => {
    const today = formatDate(new Date());
    fetch(`https://api.nasa.gov/planetary/apod?date=${today}&api_key=${NASA_API}`)
      .then<ApiResponse>(res => res.json())
      .then(result => {
        if (result.code === 400) {
          const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));
          const [yYear, yMonth, yDay] = formatDate(yesterday).split('-');
          setCurrentDate(`${yYear}-${yMonth}-${yDay}`);
          fetchData(`${yYear}-${yMonth}-${yDay}`);
        } else {
          setCurrentDate(today);
          fetchData(today);
        }
      })
      .catch(error => {
        console.error('Error fetching initial data:', error);
        setData(prevState => ({
          ...prevState,
          error: 'Failed to fetch initial data',
          isLoading: false,
        }));
        setIsDataLoaded(true);
      });
  }, [NASA_API]);

  function changeDate(e: ChangeEvent<HTMLInputElement>) {
    const chosenDate = e.target.value;
    setChosenDay(chosenDate);
    fetchData(chosenDate);
  }

  return (
    <div className="main-container">
      {!isDataLoaded ? (
        <div className="cube-loader">
          <div className="cube-top"></div>
          <div className="cube-wrapper">
            <span style={{ '--i': 0 }} className="cube-span"></span>
            <span style={{ '--i': 1 }} className="cube-span"></span>
            <span style={{ '--i': 2 }} className="cube-span"></span>
            <span style={{ '--i': 3 }} className="cube-span"></span>
          </div>
        </div>
      ) : (
        <>
          <div className='data-container left-section'>
            <div className='date-input-container'>
              <input
                className='date-input'
                type="date"
                onChange={changeDate}
                max={currentDate}
                value={chosenDay || currentDate}
              />
            </div>
            <div className='title-container'>{data.chosenDay.title}</div>
            <div className='explain-container'>{data.chosenDay.explanation}</div>
          </div>

          <div className='media-container right-section'>
            {data.isLoading ? (
              <p>Loading...</p>
            ) : data.error ? (
              <p>{data.error}</p>
            ) : data.chosenDay.mediaType === 'image' ? (
              <img className='nasa-image' src={data.chosenDay.url} alt="" />
            ) : data.chosenDay.mediaType === 'video' ? (
              <iframe
                width="800"
                height="450"
                src={data.chosenDay.url}
                title="NASA Video of the Day"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            ) : (
              <p>Media type not supported</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
