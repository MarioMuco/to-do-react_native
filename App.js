import {StatusBar} from "expo-status-bar";
import {
  KeyboardAvoidingView, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  View, 
  Keyboard, 
  ScrollView,
  TextInput, 
  Platform
} from "react-native";
import * as SQLite from "expo-sqlite";
import { useState, useEffect } from "react";


export default function App() {                                     
  //Ketu deklarohen funksionet, javascript
  const [db, setDb] = useState(SQLite.openDatabase("tasks.db"));   //database ku ruhen tasks
  const [isLoading, setIsLoading] = useState(true);                 //load database kur load app
  const [names, setNames] = useState([]);                           //tasket 
  const [currentName, setCurrentName] = useState(undefined);        //shton taske te reja
  const [IsOpacity, setOpacity] = useState(true);                   //rendesia e taskeve
  const db1 = SQLite.openDatabase('mydb.db');

  useEffect(() => {
    //---------------------kur behet load app krijohet databasi per here te pare-----------------------------------
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, isOpacity INTEGER DEFAULT 1)"
      );
    }); 

    db.transaction((tx) => {
      //shfaq elementet e ruajtura ne database
      tx.executeSql(
        "SELECT * FROM names",
        null,
        (txObj, resultSet) => {setNames(resultSet.rows._array);
                               printDatabaseData(resultSet.rows._array);
                              },
        (txObj, error) => console.log(error)
      );
    });

    setIsLoading(false);
  }, [db]);


  const printDatabaseData = (data) => {
    console.log("Database Contents:");
    console.log("==================");
    data.forEach((row) => {
      console.log(`ID: ${row.id}`);
      console.log(`Name: ${row.name}`);
      console.log(`isOpacity: ${row.isOpacity}`);
      console.log("------------------");
    });
  };


  const addName = () => {
    //shton nje task te re ne database
    db.transaction((tx) => {
      Keyboard.dismiss();
      tx.executeSql(
        "INSERT INTO names (name, isOpacity) values (?, ?)",
        [currentName, IsOpacity ? 1 : 0],
        (txObj, resultSet) => {
          let existingNames = [...names];
          existingNames.push({ id: resultSet.insertId, name: currentName, isOpacity: IsOpacity});
          setNames(existingNames);
          setCurrentName(undefined);
          setOpacity(true);
        },
        (txObj, error) => console.log(error)
      );
    });
  };


  const deleteName = (id) => {
    //fshin taskun nga databasi
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM names WHERE id = ?",
        [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingNames = [...names].filter((name) => name.id !== id);
            setNames(existingNames);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  };




  const handlePress = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT isOpacity FROM names WHERE id = ?",
        [id],
        (txObj, resultSet) => {
          const isOpacity = resultSet.rows.item(0).isOpacity;
  
          tx.executeSql(
            "UPDATE names SET isOpacity = ? WHERE id = ?",
            [!isOpacity ? 1 : 0, id],
            (txObj, resultSet) => {
              setNames((prevNames) => {
                return prevNames.map((name) => {
                  if (name.id === id) {
                    return {
                      ...name,
                      isOpacity: !isOpacity,
                    };
                  }
                  return name;
                });
              });
            },
            (txObj, error) => console.log(error)
          );
        },
        (txObj, error) => console.log(error)
      );
    });
  };

  const getBoxStyle = (name) => {
    return {
      opacity: name.isOpacity ? 1 : 0.4,
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 11,
    };
  };

  const showNames = () => {
    return names.map((name, index) => {
      const boxStyle = getBoxStyle(name);
  
      return (
        <View key={index}>
          <TouchableOpacity
            style={[styles.items, boxStyle]}
            onPress={() => handlePress(name.id)}
          >
            <View style={styles.itemLeft}>
              <TouchableOpacity
                style={styles.square}
                onPress={() => deleteName(name.id)}
              ></TouchableOpacity>
              <Text style={styles.itemText}>{name.name}</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    });
  };

 


  return (
    //----------------------------------------user interface, html------------------------------------------------
    <View style={styles.container}>
      {/*status bar ne telefon behet transparent*/}
      <StatusBar style="auto"/>
      {/*scrolling when list gets longer than the page */}
      <ScrollView contentContainerStyle={{ flexGrow: 1,}} keyboardShouldPersistTaps="handled">
        {/*Tasks*/}
        <View style={styles.tasksWrapper}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <View styles={styles.items}>
            {/*This is where tasks are showed*/}
            {showNames()}
          </View>
        </View>
      </ScrollView>

      {/*Add new task section*/}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.writeTaskWrapper}>
        <TextInput
          style={styles.input}
          placeholder={"Add a task"}
          value={currentName}
          onChangeText={setCurrentName}
        />
        <TouchableOpacity onPress={addName}>
          <View style={styles.addWrapper}>
            <Text style={styles.addText}>+</Text>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}



const styles = StyleSheet.create({
  //----------------------------------dizanji i aplikacionit, css---------------------------------------------------
  container: { //i gjith ui
    flex: 1,
    backgroundColor: "#cae9ff",
  },

  tasksWrapper: { //tekti i titullit te faqes
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom:20,
  },

  sectionTitle: {  //titulli vete
    color: "#005",
    fontSize: 30,
    paddingBottom: 20,
  },

  writeTaskWrapper: {  //shto task te re kutia e jashtme
    bottom: 17,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
  },

  input: {   //inputi i tektit te ri
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 20,
    borderColor: "black",
    borderWidth: 1,
    width: 320,
    height:50,
  },

  addWrapper: {   //butoni + kutia e jashtme
    width: 50,
    height: 50,
    backgroundColor: "white",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "black",
    borderWidth: 1,
  },

  items: {  //taskat specifike 
    backgroundColor: 'white',
    padding:15,
    borderRadius: 10,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    marginBottom:11,
},

itemLeft:{  //permbajtja e kutive te taskave
    alignItems: 'center',
    flexDirection:'row',
    flexWrap: 'wrap',
},

square:{   //butoni fshi task
    width: 22,
    height: 22,
    backgroundColor:'#62b6cb',
    opacity:0.7,
    borderRadius:5,
    marginRight:10,
    paddingLeft:10,
},

itemText:{   //teksti brenda kutive te taskeve
    maxWidth:'90%',
},

});
