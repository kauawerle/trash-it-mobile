/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/space-before-function-paren */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Feather as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  Button,
  FormControl,
  HStack,
  Text,
  TextArea,
  VStack,
} from "native-base";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  TextInput
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { SvgUri } from "react-native-svg";
import api from "../../services/api";

import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../RootStackPrams";

import styles from "./styles";

type authScreenProp = StackNavigationProp<RootStackParamList, "Points">;

interface Item {
  id: number;
  title: string;
  imageData: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const RequestPoint = () => {
  const navigation = useNavigation<authScreenProp>();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [image, setImage] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<any>("");

  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0, 0,
  ]);
  const [coordinate, setCoordinate] = useState<[number, number]>([0, 0]);

  const [description, setDescription] = useState<string>("");
  const [name, setName] = useState<string>("");

  const [uf, setUf] = useState<string[]>([]);
  const [city, setCity] = useState<string[]>([]);
  const [street, setStreet] = useState<string>("");

  const [selectedUf, setSelectedUf] = useState("");
  const [selectedCity, setSelectetCity] = useState("");

  const [cepUser, setCepUser] = useState("");

  const [user, setUser] = useState({});

  const [erro, setErro] = useState('')


  async function getCep() {
    const userCep = await api.get(
      `https://brasilapi.com.br/api/cep/v1/${cepUser}`
    );
    setSelectedUf(userCep.data.state);
    setSelectetCity(userCep.data.city);
  }

  useEffect(() => {
    api.get("/category").then((response) => {
      setItems(response.data);
    });
  }, []);

  function handleSelectItem(id: number) {
    const alredySelected = selectedItems.findIndex((item) => item === id);

    if (alredySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);

      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  function handleNavigateToPoints() {
    navigation.navigate("Points");
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  useEffect(() => {
    async function loadPosition() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Oops",
          "Precisamos da sua permissão para obter a localização"
        );
      }
      const location = await Location.getCurrentPositionAsync();
      const { latitude, longitude } = location.coords;
      setInitialPosition([latitude, longitude]);
    }
    loadPosition();
  });

  async function handleRequest() {
    try {
      const items = selectedItems.join(",");
      const user: any = await AsyncStorage.getItem("@storage_Key");
      const data = {
        name,
        image: `data:image;base64,${imageBase64}`,
        latitude: coordinate[0] ? coordinate[0] : initialPosition[0],
        longitude: coordinate[1] ? coordinate[1] : initialPosition[1],
        items,
        status: "Pendente",
        uf: selectedUf,
        city: selectedCity,
        country: "Brasil",
        description,
        street,
        id_user: null,
        email: null,
        cellphone: null,
      };
      await api.post("pontocoleta", data);
      handleNavigateToPoints();
    } catch (err:any) {
      setErro(err.response.data.message)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <HStack>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleNavigateToPoints}
          >
            <Icon name="arrow-left" size={20} color="#34cb79" />
          </TouchableOpacity>
          <Text style={styles.title}>Solicitar Ponto de coleta</Text>
        </HStack>

        <FormControl w="100%">
        <Button
          style={!image ? styles.camBtn : styles.anxImg}
          onPress={async () => await pickImage()}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: 310, height: 240, borderRadius: 8 }}
            />
          ) : (
            <VStack style={styles.camStack}>
              <Icon name="camera" size={24} color="#2E8B57" />
              <Text style={{ textAlign: "center" }}>
                Selecione uma imagem do local
              </Text>
            </VStack>
          )}
        </Button>

        <Text style={styles.title}>Endereço</Text>
        <View style={styles.containe}>
          {initialPosition[0] !== 0 && (
            <MapView
              style={styles.map}
              // loadingEnabled={initialPosition[0] === 0}
              onPress={(event: any) => {
                setCoordinate([
                  event.nativeEvent.coordinate.latitude,
                  event.nativeEvent.coordinate.longitude,
                ]);
              }}
              initialRegion={{
                latitude: initialPosition[0],
                longitude: initialPosition[1],
                longitudeDelta: 0.014,
                latitudeDelta: 0.014,
              }}
            >
              <Marker
                coordinate={{
                  latitude: coordinate[0] ? coordinate[0] : initialPosition[0],
                  longitude: coordinate[1] ? coordinate[1] : initialPosition[1],
                }}
              />
            </MapView>
          )}
          {initialPosition[0] === 0 && (
            <View>
              <Text style={styles.title}>Carregando...</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>Dados</Text>

          <FormControl.Label>Nome</FormControl.Label>
          <TextInput style={styles.input} onChangeText={setName} />

          <FormControl.Label>Informar motivo da solicitação</FormControl.Label>
          <TextArea
            autoCompleteType={false}
            backgroundColor={'white'}
            onChangeText={setDescription}
          />

        <View style={styles.select}>
          <FormControl.Label>CEP</FormControl.Label>
            <View style={styles.cepView}>
            <TextInput style={styles.CepInput} onChangeText={setCepUser} />
            <Button style={styles.buttonCep} onPress={getCep}>
              Validar Cep
            </Button>
            </View>

            <FormControl.Label>Cidade</FormControl.Label>
            <TextInput style={styles.input} value={selectedCity} />

            <FormControl.Label>Uf</FormControl.Label>
            <TextInput style={styles.input} value={selectedUf} />

            <FormControl.Label>Endereço</FormControl.Label>
            <TextInput style={styles.input} onChangeText={setStreet} />
        </View>

        <View style={styles.itemsContainer}>
          <ScrollView horizontal={true}>
            {items.map((item) => (
              <TouchableOpacity
                key={String(item.id)}
                style={[
                  styles.item,
                  selectedItems.includes(item.id) ? styles.selectedItem : {},
                ]}
                onPress={() => handleSelectItem(item.id)}
                activeOpacity={0.6}
              >
                <SvgUri
                  uri={`http://192.168.30.168:3400/uploads/${item.imageData}`}
                  // uri={`http://192.168.12.196:3333/uploads/${item.imageData}`}
                  height={30}
                  width={30}
                />
                <Text style={styles.itemTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.errorMessage}>{erro}</Text>


        <Button style={styles.button} onPress={handleRequest}>
          <Text style={styles.buttonText}>Solicitar ponto</Text>
        </Button>
        </FormControl>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RequestPoint;
