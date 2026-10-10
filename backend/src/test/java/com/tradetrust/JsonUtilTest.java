package com.tradetrust;

import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

public class JsonUtilTest {

    public static class SampleDto {
        private String name;
        private int age;

        public SampleDto() {}
        public SampleDto(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getAge() { return age; }
        public void setAge(int age) { this.age = age; }
    }

    @Test
    public void testSerializeMap() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("status", "OK");
        map.put("code", 200);

        String json = JsonUtil.toJson(map);
        assertNotNull(json);
        assertTrue(json.contains("\"status\":\"OK\""));
        assertTrue(json.contains("\"code\":200"));
    }

    @Test
    public void testDeserializeObject() throws Exception {
        String json = "{\"name\":\"Ramesh Bangles\",\"age\":45}";
        SampleDto dto = JsonUtil.fromJson(json, SampleDto.class);
        assertNotNull(dto);
        assertEquals("Ramesh Bangles", dto.getName());
        assertEquals(45, dto.getAge());
    }

    @Test
    public void testSerializeNullObject() throws Exception {
        String json = JsonUtil.toJson(null);
        assertEquals("null", json);
    }

    @Test
    public void testIgnoreUnknownProperties() throws Exception {
        String json = "{\"name\":\"Suresh Cloth\",\"age\":38,\"extraField\":\"ignoredValue\"}";
        SampleDto dto = JsonUtil.fromJson(json, SampleDto.class);
        assertNotNull(dto);
        assertEquals("Suresh Cloth", dto.getName());
    }
}
